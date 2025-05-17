const { onDocumentUpdated, onDocumentCreated, onDocumentDeleted } = require("firebase-functions/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

async function recalculateCollectedAmount(bloodNeedId, db) {
  const donationRequestsSnap = await db.collection("donationRequests")
    .where("bloodNeedId", "==", bloodNeedId)
    .where("status", "in", ["done", "completed"])
    .get();

  let totalCollected = 0;
  donationRequestsSnap.forEach(doc => {
    totalCollected += Number(doc.data().quantityML) || 0;
  });

  const needRef = db.collection("bloodNeeds").doc(bloodNeedId);
  const needSnap = await needRef.get();
  if (needSnap.exists) {
    const need = needSnap.data();
    await needRef.update({
      collectedAmount: totalCollected,
      ...(totalCollected >= (need.neededAmount || 0) ? { status: "завершено" } : {})
    });
  }
}

exports.onDonationRequestCreated = onDocumentCreated(
  { document: "donationRequests/{donationId}" },
  async (event) => {
    const data = event.data.data();
    if (data.status === "done" || data.status === "completed") {
      const db = admin.firestore();
      await recalculateCollectedAmount(data.bloodNeedId, db);
    }
    return null;
  }
);

exports.onDonationRequestUpdated = onDocumentUpdated(
  { document: "donationRequests/{donationId}" },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (
      before.status !== after.status &&
      (before.status === "done" || before.status === "completed" || after.status === "done" || after.status === "completed")
    ) {
      const db = admin.firestore();
      await recalculateCollectedAmount(after.bloodNeedId, db);
    }
    return null;
  }
);

exports.onDonationRequestDeleted = onDocumentDeleted(
  { document: "donationRequests/{donationId}" },
  async (event) => {
    const data = event.data.data();
    if (data && data.bloodNeedId) {
      const db = admin.firestore();
      await recalculateCollectedAmount(data.bloodNeedId, db);
    }
    return null;
  }
);

exports.notifyUrgentBloodNeed = onDocumentCreated(
  { document: "bloodNeeds/{needId}" },
  async (event) => {
    const need = event.data.data();
    if (!need.urgency) return null;

    const db = admin.firestore();
    // Find users with matching blood group
    const usersSnap = await db.collection("users")
      .where("bloodType", "==", need.bloodGroup)
      .get();

    const tokens = [];
    usersSnap.forEach(doc => {
      if (doc.data().expoPushToken) {
        tokens.push(doc.data().expoPushToken);
      }
    });

    if (tokens.length > 0) {
      // Expo push notification payload
      const messages = tokens.map(token => ({
        to: token,
        sound: "default",
        title: "Термінова потреба у крові!",
        body: `Потрібна кров групи ${need.bloodGroup} у центрі ${need.medicalCenterName || ''}`,
      }));
      // Send notifications via Expo
      const fetch = require('node-fetch');
      await Promise.all(messages.map(msg =>
        fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg)
        })
      ));

      console.log('Tokens:', tokens);
      console.log('Messages:', messages);
    }
    return null;
  }
);