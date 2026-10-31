// ==========================================
// 1. LOGIC ANIMASI LOADING & BLACK HOLE
// ==========================================
let percent = 0;
const percentText = document.getElementById('percent');
const blackHole = document.querySelector('.black-hole');
const loader = document.getElementById('loader');
const mainContent = document.getElementById('main-content');

const interval = setInterval(() => {
  // Kecepatan loading acak biar berasa natural
  percent += Math.floor(Math.random() * 8) + 2; 
  
  if (percent >= 100) {
    percent = 100;
    clearInterval(interval);
    
    // Mulai animasi black hole setelah loading 100%
    setTimeout(() => {
      blackHole.classList.add('active');
      document.querySelector('.loading-text').style.opacity = '0';
      document.querySelector('.vortex').style.opacity = '0';
      
      // Sembunyiin loader & munculin konten utama
      setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        mainContent.classList.add('show');
      }, 1500); // Nunggu black hole nutup layar
      
    }, 500);
  }
  percentText.innerText = percent;
}, 80);


// ==========================================
// 2. LOGIC AUTH (SUPABASE - GOOGLE & EMAIL)
// ==========================================
// GANTI DENGAN URL & KEY DARI PROJECT SUPABASE LU
const SUPABASE_URL = 'https://cwqhofeqtnnvipghbyxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cE3jVvjLoY250723gyq0Og_rdBab2Wl';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elemen DOM
const beforeLogin = document.getElementById('before-login');
const afterLogin = document.getElementById('after-login');
const userEmailText = document.getElementById('user-email');
const googleLoginBtn = document.getElementById('google-login-btn');
const emailLoginBtn = document.getElementById('email-login-btn');
const logoutBtn = document.getElementById('logout-btn');

// Modal Email
const emailModal = document.getElementById('email-modal');
const emailInput = document.getElementById('email-input');
const sendMagicLinkBtn = document.getElementById('send-magic-link');
const closeModalBtn = document.getElementById('close-modal');

// Cek Status Login
async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // Kalau udah login
    beforeLogin.style.display = 'none';
    afterLogin.style.display = 'flex';
    userEmailText.innerText = session.user.email;
  } else {
    // Kalau belum login
    beforeLogin.style.display = 'flex';
    afterLogin.style.display = 'none';
  }
}

// Event: Login Google
googleLoginBtn.onclick = async () => {
  await supabase.auth.signInWithOAuth({ 
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
};

// Event: Buka Modal Email
emailLoginBtn.onclick = () => {
  emailModal.classList.add('show');
};

// Event: Tutup Modal Email
closeModalBtn.onclick = () => {
  emailModal.classList.remove('show');
};

// Event: Kirim Magic Link
sendMagicLinkBtn.onclick = async () => {
  const email = emailInput.value;
  if (!email) {
    alert("Masukkan email lu dulu!");
    return;
  }

  sendMagicLinkBtn.innerText = "Mengirim...";
  sendMagicLinkBtn.disabled = true;

  const { error } = await supabase.auth.signInWithOtp({ 
    email: email,
    options: { emailRedirectTo: window.location.origin } // Balik ke web lu
  });

  sendMagicLinkBtn.innerText = "Kirim Link";
  sendMagicLinkBtn.disabled = false;

  if (error) {
    alert("Gagal: " + error.message);
  } else {
    alert("Cek inbox email lu! Kami udah kirim link buat login.");
    emailModal.classList.remove('show');
    emailInput.value = '';
  }
};

// Event: Logout
logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  window.location.reload();
};

// Jalanin cek user saat web dibuka
checkUser();
