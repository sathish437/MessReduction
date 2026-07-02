import psycopg2
import sys

try:
    conn = psycopg2.connect("postgres://neondb_owner:npg_70OsEwvkWlDj@ep-snowy-leaf-aormjz9l-pooler.c-2.ap-southeast-1.aws.neon.tech/MessReduction?sslmode=require")
    cur = conn.cursor()
    cur.execute("UPDATE student_details SET phone_no = '+918754734490' WHERE email_id = 'chikkouser@gmail.com'")
    conn.commit()
    print(f"Updated {cur.rowcount} row")
    cur.close()
    conn.close()
except Exception as e:
    print(e)
    sys.exit(1)
