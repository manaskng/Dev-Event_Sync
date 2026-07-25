import asyncio
import time
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId

# --- CONFIG ---
MONGODB_URI = "mongodb+srv://manasraj850_db_user:frV6aVpX7F4j2YRo@cluster0.xvfxbys.mongodb.net/?appName=Cluster0"
CONCURRENT_USERS = 200
CAPACITY = 50

# Simulate what booking.actions.ts does
async def attempt_booking_db(db, event_id, user_email):
    # This exactly mimics the Next.js booking server action:
    # { $expr: { $lt: ["$seatsTaken", "$capacity"] } }
    # { $inc: { seatsTaken: 1 } }
    
    result = await db.events.find_one_and_update(
        {
            "_id": ObjectId(event_id),
            "$expr": {"$lt": ["$seatsTaken", "$capacity"]}
        },
        {
            "$inc": {"seatsTaken": 1}
        }
    )
    
    if result:
        # If the atomic increment succeeded, we create the booking document
        await db.bookings.insert_one({
            "eventId": ObjectId(event_id),
            "email": user_email,
            "createdAt": time.time()
        })
        return True
    return False

async def run_test():
    print("=" * 60)
    print("ATOMIC BOOKING CONCURRENCY STRESS TEST (200 USERS)")
    print("=" * 60)
    
    # 1. Setup Database
    print("1. Connecting to MongoDB to setup test event...")
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.test
    
    test_event = {
        "title": "CONCURRENCY STRESS TEST EVENT",
        "slug": "concurrency-stress-test-event",
        "capacity": CAPACITY,
        "seatsTaken": 0,
    }
    
    # Cleanup old test data
    await db.events.delete_many({"slug": "concurrency-stress-test-event"})
    
    insert_result = await db.events.insert_one(test_event)
    event_id = str(insert_result.inserted_id)
    
    await db.bookings.delete_many({"eventId": ObjectId(event_id)})
    
    print(f"   Created test event ID: {event_id} with Capacity: {CAPACITY}")
    
    # 2. Fire 200 concurrent requests directly to MongoDB
    print(f"\n2. Firing {CONCURRENT_USERS} simultaneous booking requests directly via Motor (MongoDB)...")
    fake_users = [f"stressuser{i}@benchmark.com" for i in range(CONCURRENT_USERS)]
    
    start_time = time.time()
    
    # Gather 200 concurrent asyncio tasks
    tasks = [attempt_booking_db(db, event_id, email) for email in fake_users]
    results = await asyncio.gather(*tasks)
    
    end_time = time.time()
    
    # 3. Analyze Results
    print("\n3. Analyzing Results...")
    successes = [r for r in results if r]
    failures = [r for r in results if not r]
    
    # Double check database state
    final_event = await db.events.find_one({"_id": ObjectId(event_id)})
    final_bookings_count = await db.bookings.count_documents({"eventId": ObjectId(event_id)})
    
    print("\n" + "=" * 60)
    print("STRESS TEST REPORT")
    print("=" * 60)
    print(f"Test Duration:         {end_time - start_time:.2f} seconds")
    print(f"Total Requests Fired:  {CONCURRENT_USERS}")
    print(f"Successful Bookings:   {len(successes)}")
    print(f"Rejected Bookings:     {len(failures)}")
    print("-" * 60)
    print("DATABASE VERIFICATION:")
    print(f"Expected Seats Taken:  {CAPACITY}")
    print(f"Actual Seats Taken:    {final_event['seatsTaken']}")
    print(f"Actual Booking Docs:   {final_bookings_count}")
    
    print("\nCONCLUSION:")
    if final_event['seatsTaken'] == CAPACITY and final_bookings_count == CAPACITY and len(successes) == CAPACITY:
        print(f"SUCCESS: PERFECT ACID CONSISTENCY: The atomic lock successfully")
        print(f"prevented {CONCURRENT_USERS - CAPACITY} race condition attempts.")
        print("ZERO overbooking occurred.")
    else:
        print("FAIL: Overbooking or inconsistency detected.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(run_test())
