$studentJson = @"
{
  "name": "Test Student Male 4",
  "registerNo": "TEST4M001",
  "rollNo": "TEST4M001",
  "dob": "2000-01-01",
  "phoneNo": "1234567890",
  "emailId": "test4m001@example.com",
  "department": "CSE",
  "gender": "MALE",
  "year": 4
}
"@

$regResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/student/reg" -Method Post -Body $studentJson -ContentType "application/json"
$studentId = $regResponse.id

Write-Output "Created Student ID: $studentId"

$formJson = @"
{
  "year": 4,
  "roomNo": 404,
  "leaveDate": "2026-07-10",
  "leaveTime": "10:00:00",
  "arrivalDate": "2026-07-15",
  "arrivalTime": "10:00:00",
  "reason": "Test push notification"
}
"@

$formResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/student-form/StudentForm/$studentId" -Method Post -Body $formJson -ContentType "application/json"

Write-Output "Form Response:"
$formResponse | ConvertTo-Json
