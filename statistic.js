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

  // Статистика по вопросам
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

  // Если выбрано одно отделение — показываем таблицу врачей
  if (departmentFilter) {
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
}

document.addEventListener('DOMContentLoaded', () => {
  loadDepartments();
  const departmentFilter = document.getElementById('departmentFilter');
  departmentFilter.addEventListener('change', loadStatistics);
  loadStatistics();
});