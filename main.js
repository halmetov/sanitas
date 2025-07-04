// Вместо импорта
// import { createClient } from 'npm:@supabase/supabase-js@2';

// Инициализация клиента Supabase
const sb = supabase.createClient(
  'https://agklbyjwunjzqsfkeeuz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna2xieWp3dW5qenFzZmtlZXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDc0OTIsImV4cCI6MjA2NzAyMzQ5Mn0.1LH7fpYotFDJs6Pk0I-eDvowlsVJOCerl0uqiXFctqk'
);

async function loadDepartments() {
  const { data, error } = await sb.from('departments').select('*');
  if (error) {
    console.error('Error loading departments:', error);
    return;
  }
  const departmentSelect = document.getElementById('department');
  const departmentFilter = document.getElementById('departmentFilter');
  
  data.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.id;
    option.textContent = dept.name;
    if (departmentSelect) departmentSelect.appendChild(option);
    if (departmentFilter) departmentFilter.appendChild(option.cloneNode(true));
  });

  // Переносим это сюда — после того как options добавлены
  const urlParams = new URLSearchParams(window.location.search);
  const deptId = urlParams.get('dept');
  console.log('deptId:', deptId);

  if (deptId && departmentSelect) {
    departmentSelect.value = deptId;
    loadDoctors(deptId);
    loadNurses(deptId);
    departmentSelect.disabled = true; // Если нужно заблокировать выбор
  }
}


async function loadDoctors(departmentId) {
  const { data, error } = await sb
    .from('doctors')
    .select('*')
    .eq('department_id', departmentId);
  if (error) {
    console.error('Error loading doctors:', error);
    return;
  }
  const doctorSelect = document.getElementById('doctor');
  doctorSelect.innerHTML = '<option value="">Дәрігерді таңдаңыз</option>';
  data.forEach(doctor => {
    const option = document.createElement('option');
    option.value = doctor.id;
    option.textContent = doctor.name;
    doctorSelect.appendChild(option);
  });
}

async function loadNurses(departmentId) {
  const { data, error } = await sb
    .from('nurses')
    .select('*')
    .eq('department_id', departmentId);
  if (error) {
    console.error('Error loading nurses:', error);
    return;
  }
  const nurseSelect = document.getElementById('nurse');
  nurseSelect.innerHTML = '<option value="">Медбикені таңдаңыз</option>';
  data.forEach(nurse => {
    const option = document.createElement('option');
    option.value = nurse.id;
    option.textContent = nurse.name;
    nurseSelect.appendChild(option);
  });
}

function setupStars(containerId, inputId) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.textContent = '★';
    star.style.cursor = 'pointer';
    star.addEventListener('click', () => {
      input.value = i;
      Array.from(container.children).forEach((s, index) => {
        s.style.color = index < i ? '#ffc107' : '#ccc';
      });
    });
    container.appendChild(star);
  }
}

async function submitReview(event) {
  event.preventDefault();
  const form = event.target;

  const review = {
    patient_name: form.patient_name.value,
    patient_phone: form.patient_phone.value,
    department_id: form.department.value,
    doctor_id: form.doctor.value || null,
    doctor_rating: parseInt(form.doctor_rating.value) || 0,
    nurse_rating: parseInt(form.nurse_rating.value) || 0,
    answers: {
      q1: parseInt(form.q1.value) || 0,
      q2: parseInt(form.q2.value) || 0,
      q3: parseInt(form.q3.value) || 0,
      q4: parseInt(form.q4.value) || 0,
      q5: parseInt(form.q5.value) || 0,
      q6: parseInt(form.q6.value) || 0,
      q7: parseInt(form.q7.value) || 0,
    },
    created_at: new Date().toISOString(),
  };

  const { error } = await sb.from('reviews').insert([review]);
  if (error) {
    console.error('Error submitting review:', error);
    alert('Пікірді жіберу кезінде қате пайда болды');
    return;
  }

  // Telegram
  const botToken = '8123282711:AAFd2HZjUqS1KRlhNMGrCNOtjvHIuX6zSt0';
  const chatId = '758761122';
  const message = `
    Жаңа пікір келді!

    👤 ${review.patient_name}
    📞 ${review.patient_phone}
    🏥 Бөлімше ID: ${review.department_id}
    👨‍⚕️ Дәрігер ID: ${review.doctor_id}
    ⭐ Дәрігер бағасы: ${review.doctor_rating}
    ⭐ Медбике бағасы: ${review.nurse_rating}
    📝 Сауалнама: ${Object.values(review.answers).join(', ')}
      `;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
  } catch (err) {
    console.error('Telegram error:', err);
  }

  alert('Пікіріңіз сәтті жіберілді!');
  form.reset();
  setupStars('doctorStars', 'doctor_rating');
  setupStars('nurseStars', 'nurse_rating');
}

document.addEventListener('DOMContentLoaded', () => {
  loadDepartments();
  setupStars('doctorStars', 'doctor_rating');
  setupStars('nurseStars', 'nurse_rating');

  const form = document.getElementById('reviewForm');
  if (form) {
    form.addEventListener('submit', submitReview);
    document.getElementById('department').addEventListener('change', (e) => {
      loadDoctors(e.target.value);
    });
  }
});


document.addEventListener('DOMContentLoaded', () => {
  loadDepartments();
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', submitReview);
    document.getElementById('department').addEventListener('change', (e) => {
      loadDoctors(e.target.value);
      loadNurses(e.target.value);
    });
  }
  const departmentFilter = document.getElementById('departmentFilter');
  if (departmentFilter) {
    departmentFilter.addEventListener('change', loadStatistics);
    loadStatistics();
  }
});