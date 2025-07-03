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

  const { error } = await sb.from('reviews').insert([review]);
  if (error) {
    console.error('Error submitting review:', error);
    alert('Пікірді жіберу кезінде қате пайда болды');
  } else {
    alert('Пікіріңіз сәтті жіберілді!');
    form.reset();
  }
}


let chart;

async function loadStatistics() {
  const departmentFilter = document.getElementById('departmentFilter').value;
  let query = sb.from('reviews').select('answers, department_id, departments(name), doctors(name), doctor_id');
  if (departmentFilter) {
    query = query.eq('department_id', departmentFilter);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error loading statistics:', error);
    return;
  }

  // Очищаем
  const statsDiv = document.getElementById('stats');
  statsDiv.innerHTML = '<canvas id="chart"></canvas>';

  const questionLabels = [
    'Сыпайылық пен қарым-қатынас',
    'Қызмет сапасы',
    'Қызмет көрсету жылдамдығы',
    'Ақпараттың түсініктілігі',
    'Кәсіби деңгей',
    'Тазалық пен жайлылық',
    'Жалпы қанағаттану'
  ];
  const maxScores = [5, 5, 3, 3, 5, 3, 5];

  // Если фильтр по одному отделению
  if (departmentFilter) {
    // Статистика по врачам
    const doctorMap = {};

    data.forEach(review => {
      const doctorId = review.doctor_id || 'Басқа';
      if (!doctorMap[doctorId]) {
        doctorMap[doctorId] = { count: 0, sum: 0, name: review.doctors?.name || 'Аноним' };
      }
      const totalScore = Object.values(review.answers).reduce((a, b) => a + b, 0);
      doctorMap[doctorId].sum += totalScore;
      doctorMap[doctorId].count++;
    });

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.innerHTML = `
      <tr>
        <th style="border:1px solid #ccc; padding:5px;">Дәрігер</th>
        <th style="border:1px solid #ccc; padding:5px;">Орташа баға</th>
        <th style="border:1px solid #ccc; padding:5px;">Пікірлер саны</th>
      </tr>
    `;

    Object.values(doctorMap).forEach(doc => {
      const avg = doc.count ? (doc.sum / doc.count / 7).toFixed(2) : '0.00';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="border:1px solid #ccc; padding:5px;">${doc.name}</td>
        <td style="border:1px solid #ccc; padding:5px;">${avg}</td>
        <td style="border:1px solid #ccc; padding:5px;">${doc.count}</td>
      `;
      table.appendChild(row);
    });

    statsDiv.appendChild(table);
  }

  // Статистика по вопросам
  const averages = questionLabels.map((label, i) => {
    const scores = data.map(review => review.answers[`q${i + 1}`]);
    const avg = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2) : 0;
    return avg;
  });

  // Рисуем график
  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy(); // удаляем старый
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: questionLabels,
      datasets: [{
        label: 'Орташа баға',
        data: averages,
        backgroundColor: '#3e95cd',
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 5
        }
      }
    }
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
