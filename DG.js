(function() {
  var d = document, s = d.createElement('div'), t = d.createElement('div');
  s.id = 'status'; 
  s.style = 'position:fixed;top:10px;right:10px;padding:10px;background:lightgray;z-index:9999;'; 
  s.innerText = 'Status: Connecting...';
  
  t.id = 'transcript'; 
  t.style = 'position:fixed;top:50px;right:10px;padding:10px;background:white;z-index:9999;max-height:300px;max-width:400px;overflow-y:scroll;border:1px solid black;width:300px;height:200px;white-space:pre-wrap;word-wrap:break-word;';
  
  d.body.appendChild(s); 
  d.body.appendChild(t);
  
  function adjustTranscriptSize() {
    var lines = t.textContent.split('\n').length;
    t.style.height = Math.min(50 + lines * 20, window.innerHeight - 100) + 'px';
    t.style.width = Math.min(300 + lines * 10, window.innerWidth - 100) + 'px';
  }
  
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    const socket = new WebSocket('wss://api.deepgram.com/v1/listen?diarize=true&smart_format=true&redact=pci&redact=ssn&redact=numbers&model=nova-2', ['token', 'bf373551459bce132cef3b1b065859ed3e4bac8f']);
    
    socket.onopen = () => {
      s.innerText = 'Status: Connected';
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState == 1) socket.send(event.data);
      };
      mediaRecorder.start(1000);
    };
    
    socket.onmessage = (message) => {
      const received = JSON.parse(message.data);
      const transcript = received.channel.alternatives[0].transcript;
      if (transcript && received.is_final) {
        t.textContent += transcript + '\n';
        adjustTranscriptSize();
      }
    };
    
    socket.onclose = () => { s.innerText = 'Status: Disconnected'; };
    socket.onerror = (error) => { s.innerText = 'Status: Error'; console.error('WebSocket error:', error); };
  }).catch(error => {
    console.error('Error accessing media devices:', error);
    s.innerText = 'Error accessing media devices';
  });
})();
