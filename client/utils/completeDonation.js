import { doc, updateDoc, getDoc, increment } from "firebase/firestore";

/**
 * Completes a donation: updates donation status, increments user stats, updates blood need, and marks need as fulfilled if collectedAmount >= neededAmount.
 * @param {object} db - Firestore instance
 * @param {string} donationId - ID of the donationRequest document
 */
export async function completeDonation(db, donationId) {
  // 1. Update donation status
  const donationRef = doc(db, "donationRequests", donationId);
  const donationSnap = await getDoc(donationRef);
  if (!donationSnap.exists()) throw new Error("Donation not found");
  const donation = donationSnap.data();

  // 2. Update user stats
  const userRef = doc(db, "users", donation.donorId);
  await updateDoc(userRef, {
    donationAmount: increment(1),
    bloodLiters: increment(0.45),
  });

  // 3. Update blood need
  const needRef = doc(db, "bloodNeeds", donation.bloodNeedId);
  const needSnap = await getDoc(needRef);
  if (!needSnap.exists()) throw new Error("Blood need not found");
  const need = needSnap.data();
  const newCollected = (need.collectedAmount || 0) + 450;
  await updateDoc(needRef, {
    collectedAmount: increment(450),
    // Optionally, update status if fulfilled
    ...(newCollected >= (need.neededAmount || 0) ? { status: "завершено" } : {})
  });

  // 4. Mark donation as completed
  await updateDoc(donationRef, { status: "done" });
} 