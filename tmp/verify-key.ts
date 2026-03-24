
import WebSocket from 'ws';

async function testConnection() {
  const url = 'ws://localhost:4016';
  console.log(`Testing new key on ${url}...`);

  const ws = new WebSocket(url);

  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'control',
      data: JSON.stringify({
        event: 'init',
        token: '',
        agentId: 'test-agent',
        systemPrompt: 'Say "Voice Gateway Online"',
        voiceId: 'aoede',
        voiceGender: 'FEMALE'
      }),
      timestamp: Date.now()
    }));
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('Received:', JSON.stringify(msg, null, 2));
    if (msg.ok) {
       console.log('✅ GATEWAY SUCCESS WITH NEW KEY');
       process.exit(0);
    }
    if (msg.error) {
       console.error('❌ GATEWAY ERROR:', msg.error);
       process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('⌛ Timeout');
    process.exit(1);
  }, 10000);
}

testConnection();
