import urllib.request
import urllib.parse
import json
import psycopg2

DB_URL = "postgresql://neondb_owner:npg_70OsEwvkWlDj@ep-snowy-leaf-aormjz9l-pooler.c-2.ap-southeast-1.aws.neon.tech/MessReduction?sslmode=require"

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    # Find a male student in year 4
    cur.execute("SELECT id FROM student_details WHERE gender='MALE' AND year_of_study=4 LIMIT 1")
    row = cur.fetchone()
    
    if not row:
        print("No male student in year 4 found. We'll create one.")
        cur.execute("INSERT INTO student_details (email_id, gender, name, phone_no, register_no, room_no, year_of_study, dept, mess_type) VALUES ('teststudent4@example.com', 'MALE', 'Test Student 4', '1234567890', 'REG004', 404, 4, 'CSE', 'VEG') RETURNING id")
        student_id = cur.fetchone()[0]
        conn.commit()
    else:
        student_id = row[0]
    
    cur.close()
    conn.close()
    
    print(f"Using student ID: {student_id}")

    data = {
        "year": 4,
        "roomNo": 404,
        "leaveDate": "2026-07-10",
        "leaveTime": "10:00:00",
        "arrivalDate": "2026-07-15",
        "arrivalTime": "10:00:00",
        "reason": "Test push notification"
    }

    req = urllib.request.Request(
        f"http://localhost:8080/api/student-form/StudentForm/{student_id}",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as response:
        print("Response Code:", response.getcode())
        print("Response Body:", response.read().decode("utf-8"))

except Exception as e:
    print("Error:", e)
