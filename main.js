// main.js
import { createClient } from 'npm:@supabase/supabase-js@2';

// Инициализация клиента Supabase
const supabase = createClient(
  'https://agklbyjwunjzqsfkeeuz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJisp3OiJzdXBhYmFzZSIsInJlZiI6ImFna2xieWp3dW5qenFzZmtlZXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDc0OTIsImV4cCI6MjA2NzAyMzQ5Mn0.1LH7fpYotFDJs6Pk0I-eDvowlsVJOCerl0uqiXFctqk'
);

async function loadDepartments() {
  const { data, error } = await supabase.from('departments').select('*');
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

  const urlParams = new URLSearchParams(window.location.search);
  const deptId = urlParams.get('dept');
  console.log('deptId:', deptId); // Отладка
  if (deptId && departmentSelect) {
    departmentSelect.value = deptId;
    departmentSelect.disabled = true;
    loadDoctors(deptId);
    loadNurses(deptId);
  }
}

async function loadDoctors(departmentId) {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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

async function submitReview(event) {
  event.preventDefault();
  const form = event.target;
  const review = {
    patient_name: form.patient_name.value,
    patient_phone: form.patient_phone.value,
    department_id: form.department.value,
    doctor_id: form.doctor.value || null,
    nurse_id: form.nurse.value || null,
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

  const { error } = await supabase.from('reviews').insert([review]);
  if (error) {
    console.error('Error submitting review:', error);
    alert('Пікірді жіберу кезінде қате пайда болды');
  } else {
    alert('Пікіріңіз сәтті жіберілді!');
    form.reset();
  }
}

async function loadStatistics() {
  const departmentFilter = document.getElementById('departmentFilter').value;
  let query = supabase.from('reviews').select('answers, department_id, departments(name)');
  if (departmentFilter) {
    query = query.eq('department_id', departmentFilter);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error loading statistics:', error);
    return;
  }

  const statsDiv = document.getElementById('stats');
  statsDiv.innerHTML = '';

  const questionLabels = [
    'Қызметкерлердің сыпайылығы мен қарым-қатынасы',
    'Көрсетілген қызметтің сапасы',
    'Қызмет көрсету жылдамдығы',
    'Ақпараттың түсініктілігі',
    'Қызметкерлердің кәсіби деңгейі',
    'Мекеме тазалығы мен жайлылығы',
    'Жалпы қанағаттану деңгейі',
  ];

  const maxScores = [5, 5, 3, 3, 5, 3, 5];
  questionLabels.forEach((label, i) => {
    const scores = data.map(review => review.answers[`q${i + 1}`]);
    const avgScore = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2) : '0.00';
    const statDiv = document.createElement('div');
    statDiv.className = 'stat';
    statDiv.innerHTML = `
      <h3>${label}</h3>
      <p>Орташа баға: ${avgScore} / ${maxScores[i]}</p>
      <p>Пікірлер саны: ${scores.length}</p>
    `;
    statsDiv.appendChild(statDiv);
  });
}

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