const axios = require('axios');

async function testDirectMessage() {
  const token = 'EAAWrPPcUAM0BR4l54N2kJoCPoRd4VjVviaY30ZBZBZBX7eqFA8ruof8OAC9l7dmhd2sE2uttkIaIUMryLksH4ZAETHckoHiYUKqEcgW6QiVowb03srdNNy0rxzI30PPbcdQ30ZBfUZB3rPS9XIRD4trtVDX4qjmzRv1zg4LEdaDBR9OfklCqoqeYOxD0w0Ea5WhMJLixZACHN7LMNTRVXpTcZCKrKf01vHzttuZABjKab0VPI6mwtZCncdMP81Lh08CB4IZBCZCDxMPsQToTgvkpqgtO1ZAcZD';
  const phoneNumberId = '1166465536556478';
  const targetNumber = '+917708988616';
  
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: targetNumber,
    type: 'text',
    text: {
      preview_url: false,
      body: 'Hello! This is a test message from Mess Reduction System to ' + targetNumber
    }
  };

  try {
    console.log('Sending direct message to Meta API...');
    const res = await axios.post(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('SUCCESS! Response:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('FAILED! Meta API Error:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error:', err.message);
    }
  }
}

testDirectMessage();
