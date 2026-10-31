// ==========================================
// 1. LOGIC ANIMASI LOADING BAR (0 - 100%)
// ==========================================
let percent = 0;
const percentText = document.getElementById('percent');
const progressBar = document.getElementById('progress-bar');
const loader = document.getElementById('loader');
const mainContent = document.getElementById('main-content');

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


// ==========================================
// 2. LOGIC AUTH (SUPABASE - GOOGLE & EMAIL)
// ==========================================
// GANTI DENGAN URL & KEY DARI PROJECT SUPABASE LU
const SUPABASE_URL = 'https://cwqhofeqtnnvipghbyxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cE3jVvjLoY250723gyq0Og_rdBab2Wl';

let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('sb_publishable_')) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase URL/Key belum diisi. Fitur login mati.");
}

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

async function checkUser() {
  if (!supabaseClient) return;

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
      beforeLogin.style.display = 'none';
      afterLogin.style.display = 'flex';
      userEmailText.innerText = session.user.email;
    } else {
      beforeLogin.style.display = 'flex';
      afterLogin.style.display = 'none';
    }
  } catch (err) {
    console.error("Error cek user:", err);
  }
}

if (googleLoginBtn) {
  googleLoginBtn.onclick = async () => {
    if (!supabaseClient) return alert("Supabase belum disetting!");
    await supabaseClient.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };
}

if (emailLoginBtn) {
  emailLoginBtn.onclick = () => {
    emailModal.classList.add('show');
  };
}

if (closeModalBtn) {
  closeModalBtn.onclick = () => {
    emailModal.classList.remove('show');
  };
}

if (sendMagicLinkBtn) {
  sendMagicLinkBtn.onclick = async () => {
    if (!supabaseClient) return alert("Supabase belum disetting!");
    
    const email = emailInput.value;
    if (!email) return alert("Masukkan email lu dulu!");

    sendMagicLinkBtn.innerText = "MENGIRIM...";
    sendMagicLinkBtn.disabled = true;

    const { error } = await supabaseClient.auth.signInWithOtp({ 
      email: email,
      options: { emailRedirectTo: window.location.origin }
    });

    sendMagicLinkBtn.innerText = "KIRIM";
    sendMagicLinkBtn.disabled = false;

    if (error) {
      alert("Gagal: " + error.message);
    } else {
      alert("Cek inbox email lu! Kami udah kirim link login.");
      emailModal.classList.remove('show');
      emailInput.value = '';
    }
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


// ==========================================
// 3. EFEK PARTIKEL (PERCIKAN BRUTALIST) SAAT KLIK
// ==========================================
document.addEventListener('click', function(e) {
  const colors = ['#FF90E8', '#FFC900', '#00E0FF', '#000000', '#25D366']; 
  
  for (let i = 0; i < 10; i++) {
    createParticle(e.clientX, e.clientY, colors);
  }
});

function createParticle(x, y, colors) {
  const particle = document.createElement('div');
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.floor(Math.random() * 5) + 6;
  
  particle.style.position = 'fixed';
  particle.style.left = x + 'px';
  particle.style.top = y + 'px';
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';
  particle.style.backgroundColor = color;
  particle.style.border = '2px solid #000';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '99999';
  
  document.body.appendChild(particle);

  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 80 + 20;
  const tx = Math.cos(angle) * velocity;
  const ty = Math.sin(angle) * velocity;

  const animation = particle.animate([
    { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
    { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
  ], {
    duration: Math.random() * 400 + 400,
    easing: 'cubic-bezier(0, .9, .57, 1)'
  });

  animation.onfinish = () => particle.remove();
}
