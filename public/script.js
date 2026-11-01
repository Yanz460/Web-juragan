// ==========================================
// 1. SETUP SUPABASE
// ==========================================
const SUPABASE_URL = 'https://cwqhofeqtnnvipghbyxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cE3jVvjLoY250723gyq0Og_rdBab2Wl';

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('sb_publishable_')) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Deteksi halaman
const isChatPage = window.location.pathname.includes('chat.html');
const isDashPage = window.location.pathname.includes('dashboard.html');

// ==========================================
// 2. LOGIC HALAMAN UTAMA (index.html)
// ==========================================
if (!isChatPage && !isDashPage) {
  // Animasi Loading
  let percent = 0;
  const percentText = document.getElementById('percent');
  const progressBar = document.getElementById('progress-bar');
  const loader = document.getElementById('loader');
  const mainContent = document.getElementById('main-content');

  if (percentText) {
    const interval = setInterval(() => {
      percent += Math.floor(Math.random() * 10) + 5; 
      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        setTimeout(() => {
          loader.style.opacity = '0';
          loader.style.visibility = 'hidden';
          mainContent.classList.add('show');
        }, 500);
      }
      percentText.innerText = percent;
      progressBar.style.width = percent + '%';
    }, 100);
  }

  // Elemen DOM Auth
  const beforeLogin = document.getElementById('before-login');
  const afterLogin = document.getElementById('after-login');
  const userEmailText = document.getElementById('user-email');
  const googleLoginBtn = document.getElementById('google-login-btn');
  const emailLoginBtn = document.getElementById('email-login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const emailModal = document.getElementById('email-modal');
  const emailInput = document.getElementById('email-input');
  const sendMagicLinkBtn = document.getElementById('send-magic-link');
  const closeModalBtn = document.getElementById('close-modal');
  const navLinks = document.getElementById('nav-links');

  async function checkUser() {
    if (!supabaseClient) return;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        beforeLogin.style.display = 'none';
        afterLogin.style.display = 'flex';
        userEmailText.innerText = session.user.email;
        if (navLinks) navLinks.style.display = 'flex';
      } else {
        beforeLogin.style.display = 'flex';
        afterLogin.style.display = 'none';
        if (navLinks) navLinks.style.display = 'none';
      }
    } catch (err) { console.error(err); }
  }

  if (googleLoginBtn) {
    googleLoginBtn.onclick = async () => {
      if (!supabaseClient) return alert("Supabase belum disetting!");
      await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin }});
    };
  }

  if (emailLoginBtn) emailLoginBtn.onclick = () => emailModal.classList.add('show');
  if (closeModalBtn) closeModalBtn.onclick = () => emailModal.classList.remove('show');

  if (sendMagicLinkBtn) {
    sendMagicLinkBtn.onclick = async () => {
      if (!supabaseClient) return alert("Supabase belum disetting!");
      const email = emailInput.value;
      if (!email) return alert("Masukkan email lu dulu!");
      sendMagicLinkBtn.innerText = "MENGIRIM...";
      sendMagicLinkBtn.disabled = true;
      const { error } = await supabaseClient.auth.signInWithOtp({ email: email, options: { emailRedirectTo: window.location.origin + '/chat.html' }});
      sendMagicLinkBtn.innerText = "KIRIM";
      sendMagicLinkBtn.disabled = false;
      if (error) alert("Gagal: " + error.message);
      else { alert("Cek email lu!"); emailModal.classList.remove('show'); emailInput.value = ''; }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      if (!supabaseClient) return;
      await supabaseClient.auth.signOut();
      window.location.reload();
    };
  }
  checkUser();
}

// ==========================================
// 3. LOGIC HALAMAN CHAT (chat.html)
// ==========================================
if (isChatPage) {
  const chatBox = document.getElementById('chat-box');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const logoutBtnChat = document.getElementById('logout-btn-chat');

  async function checkAuthForChat() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      alert("Lu harus login dulu buat masuk ke Chat Global!");
      window.location.href = '/';
    } else {
      initChat(session.user.email);
    }
  }

  function appendMessage(email, text, isMyMessage) {
    const emptyMsg = chatBox.querySelector('.chat-empty');
    if (emptyMsg) emptyMsg.remove();
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${isMyMessage ? 'my-msg' : ''}`;
    const name = email.split('@')[0];
    msgDiv.innerHTML = `<div class="sender">${isMyMessage ? 'Lu' : name}</div><div class="text">${text}</div>`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function initChat(myEmail) {
    if (!supabaseClient) return;
    // Ambil riwayat chat
    const { data } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: true }).limit(50);
    if (data) {
      if (data.length === 0) {
        chatBox.innerHTML = '<div class="chat-empty">Belum ada pesan. Jadi yang pertama!</div>';
      } else {
        chatBox.innerHTML = '';
        data.forEach(msg => appendMessage(msg.user_email, msg.message, msg.user_email === myEmail));
      }
    }
    
    // Realtime Listener
    supabaseClient.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new;
        appendMessage(newMsg.user_email, newMsg.message, newMsg.user_email === myEmail);
      })
      .subscribe();
  }

  if (chatSendBtn) {
    chatSendBtn.onclick = async () => {
      if (!supabaseClient) return alert("Supabase belum disetting!");
      const text = chatInput.value.trim();
      if (!text) return;
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return alert("Sesi login habis, silakan login ulang.");
      
      chatSendBtn.disabled = true;
      const { error } = await supabaseClient.from('messages').insert([{ user_email: user.email, message: text }]);
      chatSendBtn.disabled = false;
      
      if (error) alert("Gagal kirim: " + error.message);
      else chatInput.value = ''; 
    };
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') chatSendBtn.click(); });
  }

  if (logoutBtnChat) {
    logoutBtnChat.onclick = async () => {
      if (!supabaseClient) return;
      await supabaseClient.auth.signOut();
      window.location.href = '/';
    };
  }

  checkAuthForChat();
}

// ==========================================
// 4. LOGIC HALAMAN DASHBOARD (dashboard.html)
// ==========================================
if (isDashPage) {
  const logoutBtnDash = document.getElementById('logout-btn-dash');

  // Animasi Simulasi CPU/RAM
  function simulateServer() {
    const cpuVal = document.getElementById('cpu-value');
    const cpuBar = document.getElementById('cpu-bar');
    const ramVal = document.getElementById('ram-value');
    const ramBar = document.getElementById('ram-bar');
    const gpuVal = document.getElementById('gpu-value');

    setInterval(() => {
      // Simulasi CPU (10% - 85%)
      const cpu = Math.floor(Math.random() * 75) + 10;
      cpuVal.innerText = cpu + '%';
      cpuBar.style.width = cpu + '%';

      // Simulasi RAM (1.0 GB - 3.8 GB)
      const ram = (Math.random() * 2.8 + 1.0).toFixed(1);
      const ramPercent = (ram / 4) * 100;
      ramVal.innerText = ram + ' GB';
      ramBar.style.width = ramPercent + '%';

      // Simulasi GPU (IDLE / ACTIVE)
      gpuVal.innerText = Math.random() > 0.7 ? 'ACTIVE' : 'IDLE';
    }, 2000); // Update tiap 2 detik
  }
  simulateServer();

  if (logoutBtnDash) {
    logoutBtnDash.onclick = async () => {
      if (!supabaseClient) return;
      await supabaseClient.auth.signOut();
      window.location.href = '/';
    };
  }
}

// ==========================================
// 5. EFEK PARTIKEL (BERLAKU DI SEMUA HALAMAN)
// ==========================================
document.addEventListener('click', function(e) {
  const colors = ['#FF90E8', '#FFC900', '#00E0FF', '#000000', '#25D366']; 
  for (let i = 0; i < 10; i++) createParticle(e.clientX, e.clientY, colors);
});

function createParticle(x, y, colors) {
  const particle = document.createElement('div');
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.floor(Math.random() * 5) + 6;
  
  particle.style.position = 'fixed';
  particle.style.left = x + 'px'; particle.style.top = y + 'px';
  particle.style.width = size + 'px'; particle.style.height = size + 'px';
  particle.style.backgroundColor = color;
  particle.style.border = '2px solid #000'; particle.style.pointerEvents = 'none';
  particle.style.zIndex = '99999';
  document.body.appendChild(particle);

  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 80 + 20;
  const tx = Math.cos(angle) * velocity; const ty = Math.sin(angle) * velocity;

  const animation = particle.animate([
    { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
    { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
  ], { duration: Math.random() * 400 + 400, easing: 'cubic-bezier(0, .9, .57, 1)' });

  animation.onfinish = () => particle.remove();
}
