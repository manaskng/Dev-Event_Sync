"""
Concurrency Stress Test for Atomic Booking Consistency
Tests that MongoDB $inc + $expr prevents overbooking under concurrent load.

Run AFTER starting Next.js dev server: npm run dev (port 3000)
"""
import asyncio
import aiohttp
import json
from collections import Counter

# ─── CONFIG ───────────────────────────────────────────
# Replace these with a real event ID and real user emails from your DB
# You can find an event _id from your MongoDB Atlas dashboard
EVENT_ID = "REPLACE_WITH_REAL_EVENT_ID"   # <-- paste a real MongoDB ObjectId here
EVENT_SLUG = "REPLACE_WITH_REAL_SLUG"      # <-- paste the event slug here
CAPACITY = 5                               # Set a small capacity for the test (e.g., 5)
CONCURRENT_USERS = 20                      # We fire 20 requests simultaneously
NEXTJS_URL = "http://localhost:3000"

# 20 fake user emails to simulate concurrent booking attempts
FAKE_USERS = [f"testuser{i}@benchmark.com" for i in range(CONCURRENT_USERS)]

async def attempt_booking(session: aiohttp.ClientSession, user_email: str) -> dict:
    """
    Calls the Next.js API route that wraps createBooking server action.
    We call the API route directly to simulate concurrent HTTP requests.
    """
    payload = {
        "eventId": EVENT_ID,
        "slug": EVENT_SLUG,
        "email": user_email
    }
    try:
        async with session.post(
            f"{NEXTJS_URL}/api/bookings/create",
            json=payload,
            timeout=aiohttp.ClientTimeout(total=10)
        ) as response:
            data = await response.json()
            return {"email": user_email, "result": data}
    except Exception as e:
        return {"email": user_email, "result": {"error": str(e)}}

async def run_concurrency_test():
    print("=" * 50)
    print("ATOMIC BOOKING CONCURRENCY TEST")
    print("=" * 50)
    print(f"Event Capacity: {CAPACITY}")
    print(f"Concurrent booking attempts: {CONCURRENT_USERS}")
    print(f"Expected successful bookings: {CAPACITY}")
    print(f"Expected rejected bookings: {CONCURRENT_USERS - CAPACITY}")
    print("\nFiring all {CONCURRENT_USERS} requests simultaneously...")

    async with aiohttp.ClientSession() as session:
        # Fire ALL requests at the exact same moment
        tasks = [attempt_booking(session, email) for email in FAKE_USERS]
        results = await asyncio.gather(*tasks)

    # Analyze results
    successes = [r for r in results if r["result"].get("success")]
    failures = [r for r in results if r["result"].get("error")]

    print("\n" + "=" * 50)
    print("RESULTS")
    print("=" * 50)
    print(f"✅ Successful bookings: {len(successes)}")
    print(f"❌ Rejected bookings:   {len(failures)}")

    if len(successes) == CAPACITY:
        print(f"\n🎯 PERFECT: Exactly {CAPACITY} bookings succeeded. Zero overbooking!")
        print("✅ Resume claim VERIFIED: '100% atomic consistency preventing race conditions'")
    elif len(successes) > CAPACITY:
        print(f"\n🚨 OVERBOOKED! {len(successes)} succeeded but capacity is {CAPACITY}.")
        print("❌ Resume claim FAILED: The atomic guard is not working.")
    else:
        print(f"\n⚠️  Only {len(successes)} succeeded (expected {CAPACITY}). Check if event exists and capacity is set correctly.")

    print("\nFailed reasons:")
    for f in failures[:5]:
        print(f"  - {f['email']}: {f['result'].get('error', 'unknown')}")

if __name__ == "__main__":
    if EVENT_ID == "REPLACE_WITH_REAL_EVENT_ID":
        print("ERROR: Please replace EVENT_ID and EVENT_SLUG with real values from your MongoDB Atlas database!")
        print("Steps:")
        print("  1. Go to MongoDB Atlas > Browse Collections > events")
        print("  2. Copy any event's _id and slug")
        print("  3. Set CAPACITY in that event to 5 (for testing)")
        print("  4. Paste the values at the top of this script")
    else:
        asyncio.run(run_concurrency_test())
