const sb = supabase.createClient(
  'https://agklbyjwunjzqsfkeeuz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna2xieWp3dW5qenFzZmtlZXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDc0OTIsImV4cCI6MjA2NzAyMzQ5Mn0.1LH7fpYotFDJs6Pk0I-eDvowlsVJOCerl0uqiXFctqk'
);

const correctUsername = 'admin';
const correctPassword = '12345';

document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  if (username === correctUsername && password === correctPassword) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    initStatistics();
  } else {
    alert('Қате логин немесе құпия сөз!');
  }
});

async function loadDepartments() {
  const { data, error } = await sb.from('departments').select('*');
  if (error) {
    console.error('Error loading departments:', error);
    return;
  }
  const departmentFilter = document.getElementById('departmentFilter');
  data.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.id;
    option.textContent = dept.name;
    departmentFilter.appendChild(option);
  });
}

let chart;

async function loadStatistics() {
  const departmentFilter = document.getElementById('departmentFilter').value;
  let query = sb.from('reviews').select('answers, department_id, doctor_id, doctors(name)');
  if (departmentFilter) {
    query = query.eq('department_id', departmentFilter);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error loading statistics:', error);
    return;
  }

  const statsDiv = document.getElementById('stats');
  statsDiv.innerHTML = '<canvas id="chart"></canvas>';

  const questionLabels = [
    'Сыпайылық пен қарым-қатынас',
    'Қызмет сапасы',
    'Қызмет көрсету жылдамдығы',
    'Ақпарат түсініктілігі',
    'Кәсіби деңгей',
    'Тазалық пен жайлылық',
    'Жалпы қанағаттану'
  ];

  const averages = questionLabels.map((_, i) => {
    const scores = data.map(review => review.answers[`q${i + 1}`]);
    const avg = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2) : 0;
    return avg;
  });

  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();
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

function initStatistics() {
  loadDepartments();
  const departmentFilter = document.getElementById('departmentFilter');
  departmentFilter.addEventListener('change', loadStatistics);
  loadStatistics();
}