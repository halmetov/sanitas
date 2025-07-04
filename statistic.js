const sb = supabase.createClient(
  'https://agklbyjwunjzqsfkeeuz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna2xieWp3dW5qenFzZmtlZXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDc0OTIsImV4cCI6MjA2NzAyMzQ5Mn0.1LH7fpYotFDJs6Pk0I-eDvowlsVJOCerl0uqiXFctqk'
);

let chart;

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('loginError');

  // Статичный логин/пароль
  if (username === 'admin' && password === '123456') {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    loadDepartments();
    loadStatistics();
  } else {
    errorEl.style.display = 'block';
  }
});

function getAnswerText(questionNumber, value) {
  const texts = {
    q1: {
      5: 'Өте риза болдым',
      4: 'Риза болдым',
      3: 'Орташа',
      2: 'Риза болмадым',
      1: 'Мүлде риза болмадым'
    },
    q2: {
      5: 'Өте жақсы',
      4: 'Жақсы',
      3: 'Қанағаттанарлық',
      2: 'Нашар',
      1: 'Өте нашар'
    },
    q3: {
      3: 'Иә, толық қанағаттандырды',
      2: 'Жартылай қанағаттандырды',
      1: 'Жоқ, қанағаттандырмады'
    },
    q4: {
      3: 'Иә, толық түсінікті',
      2: 'Жартылай түсінікті',
      1: 'Мүлде түсініксіз'
    },
    q5: {
      5: 'Өте жоғары',
      4: 'Жоғары',
      3: 'Орташа',
      2: 'Төмен',
      1: 'Өте төмен'
    },
    q6: {
      3: 'Иә, толық қанағаттандырды',
      2: 'Жартылай қанағаттандырды',
      1: 'Жоқ, қанағаттандырмады'
    },
    q7: {
      5: 'Өте риза болдым',
      4: 'Риза болдым',
      3: 'Орташа',
      2: 'Риза болмадым',
      1: 'Мүлде риза болмадым'
    }
  };

  return texts[questionNumber]?.[value] || value;
}

async function loadDepartments() {
  const { data, error } = await sb.from('departments').select('*');
  if (error) {
    console.error('Error loading departments:', error);
    return;
  }
  const departmentFilter = document.getElementById('departmentFilter');
  departmentFilter.innerHTML = '<option value="">Барлық бөлімшелер</option>';
  data.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.id;
    option.textContent = dept.name;
    departmentFilter.appendChild(option);
  });
}

function generateStars(score) {
  const rounded = Math.round(score);
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= rounded ? '⭐' : '☆';
  }
  return stars;
}

async function loadStatistics() {
  const departmentFilter = document.getElementById('departmentFilter').value;
  let query = sb.from('reviews').select('answers, department_id, patient_name, patient_phone, doctor_id, nurse_id, departments(name), doctors(name), nurses(name), doctor_rating, nurse_rating');

  if (departmentFilter) {
    query = query.eq('department_id', departmentFilter);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error loading statistics:', error);
    return;
  }

  // Диаграмма
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

  // Отзывы
  const reviewsDiv = document.getElementById('reviewsContainer');
  reviewsDiv.innerHTML = ''; // Очистка

  data.forEach(review => {
    const card = document.createElement('div');
    card.classList.add('review-card');

    const h3 = document.createElement('h3');
    h3.textContent = `${review.patient_name || 'Аноним'} (${review.patient_phone || 'Жоқ'})`;

    const pDepartment = document.createElement('p');
    pDepartment.innerHTML = `<strong>Бөлімше:</strong> ${review.departments?.name || '-'}`;

    const pDoctor = document.createElement('p');
    pDoctor.innerHTML = `<strong>Дәрігер:</strong> ${review.doctors?.name || '-'}`;

    const doctorStars = '★'.repeat(review.doctor_rating || 0) + '☆'.repeat(5 - (review.doctor_rating || 0));
    const pDoctorRating = document.createElement('p');
    pDoctorRating.innerHTML = `<strong>Дәрігердің бағасы:</strong> ${doctorStars}`;

    const pNurse = document.createElement('p');
    pNurse.innerHTML = `<strong>Медбике:</strong> ${review.nurses?.name || '-'}`;

    const nurseStars = '★'.repeat(review.nurse_rating || 0) + '☆'.repeat(5 - (review.nurse_rating || 0));
    const pNurseRating = document.createElement('p');
    pNurseRating.innerHTML = `<strong>Медбикенің бағасы:</strong> ${nurseStars}`;

    const button = document.createElement('button');
    button.textContent = 'Подробнее';

    const detailsDiv = document.createElement('div');
    detailsDiv.classList.add('details');
    detailsDiv.style.display = 'none';
    detailsDiv.innerHTML = `
      <ul>
        ${Object.entries(review.answers).map(([q, val]) => `<li><strong>${q.toUpperCase()}:</strong> ${getAnswerText(q, val)}</li>`).join('')}
      </ul>
    `;

    button.addEventListener('click', () => {
      if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        button.textContent = 'Скрыть';
      } else {
        detailsDiv.style.display = 'none';
        button.textContent = 'Подробнее';
      }
    });

    card.appendChild(h3);
    card.appendChild(pDepartment);
    card.appendChild(pDoctor);
    card.appendChild(pDoctorRating);
    card.appendChild(pNurse);
    card.appendChild(pNurseRating);
    card.appendChild(button);
    card.appendChild(detailsDiv);

    reviewsDiv.appendChild(card);
  });
} // ← ЗАКРЫВАЕТ функцию loadStatistics

document.getElementById('departmentFilter').addEventListener('change', loadStatistics);
