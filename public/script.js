// ==========================================
// 1. LOGIC LOADING SEDERHANA (ANTI STUCK)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader');
  const mainContent = document.getElementById('main-content');
  
  // Kasih delay 1 detik biar ada efek "kedip" dikit, terus munculin web
  setTimeout(() => {
    if(loader) {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
    }
    if(mainContent) {
      mainContent.classList.add('show');
    }
  }, 1000); // 1000 = 1 detik
});


// ==========================================
// 2. LOGIC AUTH (SUPABASE - GOOGLE & EMAIL)
// ==========================================
// GANTI DENGAN URL & KEY DARI PROJECT SUPABASE LU
const SUPABASE_URL = 'https://cwqhofeqtnnvipghbyxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cE3jVvjLoY250723gyq0Og_rdBab2Wl';

let supabaseClient = null;

// Cek apakah URL dan Key udah diisi, biar nggak error
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('sb_publishable_')) {
  // Ganti nama jadi supabaseClient biar nggak bentrok sama library
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase URL/Key belum diisi dengan benar. Fitur login dimatikan sementara.");
}

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
  if (!supabaseClient) return; // Skip kalau supabase belum di-setup

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

// Event: Login Google
if (googleLoginBtn) {
  googleLoginBtn.onclick = async () => {
    if (!supabaseClient) return alert("Supabase belum disetting di kode!");
    await supabaseClient.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };
}

// Event: Buka Modal Email
if (emailLoginBtn) {
  emailLoginBtn.onclick = () => {
    emailModal.classList.add('show');
  };
}

// Event: Tutup Modal Email
if (closeModalBtn) {
  closeModalBtn.onclick = () => {
    emailModal.classList.remove('show');
  };
}

// Event: Kirim Magic Link
if (sendMagicLinkBtn) {
  sendMagicLinkBtn.onclick = async () => {
    if (!supabaseClient) return alert("Supabase belum disetting di kode!");
    
    const email = emailInput.value;
    if (!email) {
      alert("Masukkan email lu dulu!");
      return;
    }

    sendMagicLinkBtn.innerText = "Mengirim...";
    sendMagicLinkBtn.disabled = true;

    const { error } = await supabaseClient.auth.signInWithOtp({ 
      email: email,
      options: { emailRedirectTo: window.location.origin }
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
}

// Event: Logout
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.reload();
  };
}

// Jalanin cek user
checkUser();
