// auth, database 앱 인스턴스 생성
const auth = firebase.auth();
const database = firebase.database();

const headerUser = document.querySelector(".header__user");
const userBtn = document.querySelector(".header__user-button");
const userSignIn = document.querySelector(".user__sign-in");
const userSignOut = document.querySelector(".user__sign-out");
const facebookLoginBtn = document.querySelector(".sign-in__facebook");
const googleLoginBtn = document.querySelector(".sign-in__google");
const signOutBtn = document.querySelector(".user__sign-out");
const userInfo = document.querySelector(".user__info");
const citySelect = document.querySelector(".location__city-select");
const locationSearch = document.querySelector(".location__search")
const searchInput = document.querySelector(".search__input");
const locationCountry = document.querySelector(".location__country");
const locationTime = document.querySelector(".location__time");
const weatherDegree = document.querySelector(".weather__degree");
const weatherCondition = document.querySelector(".weather__condition");
const weatherRainfall = document.querySelector(".weather__rainfall");
const weatherWind = document.querySelector(".weather__wind");
const weatherForecast = document.querySelector(".weather__forecast");
const searchHistory = document.querySelector(".search__history");

async function init() {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=seoul&APPID=6c80032342ac8a4aecd41a0bbd4bdc18`);
  const data = await res.json();
  console.log(data);
  citySelect.textContent = data.name;
  weatherDegree.textContent = `${Math.floor(data.main.temp - 273)}°`;
  weatherCondition.textContent = data.weather[0].main;
  locationCountry.textContent = 'SOUTH KOREA';

  (function printNow() {
    const today = new Date();

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    // getDay: 해당 요일(0 ~ 6)를 나타내는 정수를 반환한다.
    const day = dayNames[today.getDay()];

    let year = today.getFullYear(),
      month = String(today).substring(4, 7).toUpperCase(),
      date = today.getDate(),
      hour = today.getHours(),
      minute = today.getMinutes(),
      second = today.getSeconds();
    ampm = hour >= 12 ? "PM" : "AM";

    // 12시간제로 변경
    hour = hour % 12;
    hour = hour ? hour : 12; // 0 => 12

    // 10미만인 분과 초를 2자리로 변경
    minute = minute < 10 ? "0" + minute : minute;
    second = second < 10 ? "0" + second : second;

    const now = `${day}, ${month} ${date} ${hour}${ampm}`
    locationTime.textContent = now;
    setTimeout(printNow, 1000);
  })();
}

async function enumSearchHistory() {
  if (auth.currentUser) {
    searchHistory.innerHTML = '';
    const uid = auth.currentUser.uid;
    const snapshot = await database.ref(`/users/${uid}/regions`).orderByKey().limitToLast(5).once('value');
    const datas = snapshot.val();
    for (const [countryId, {
        city,
        country
      }] of Object.entries(datas)) {
      const listEl = document.createElement('li');
      listEl.innerHTML = `
        ${city}, <span>${country}</span>
        `;
      const buttonEl = document.createElement('button');
      buttonEl.textContent = '삭제';
      buttonEl.classList.add('history__delete-button');
      buttonEl.addEventListener('click', e => {
        database.ref(`/users/${uid}/regions/${countryId}`).remove();
        e.currentTarget.parentNode.remove();
      });
      searchHistory.appendChild(listEl);
      listEl.appendChild(buttonEl);
    }
  }
}


/* Sign in */

userBtn.addEventListener('click', e => {
  headerUser.classList.toggle('invisible');
})

/** Sign in - 페이스북, 구글 **/

facebookLoginBtn.addEventListener('click', async e => {
  const provider = new firebase.auth.FacebookAuthProvider();
  const result = await auth.signInWithPopup(provider);

  const token = result.credential.accessToken;
  const user = result.user;

  // 유저 정보 표시
  const USER_INFO_STR = `
    <div class="user__info clearfix">
      <div class="info__display-name">${user.displayName}</div>
      <div class="info__profile-img-wrapper">
        <img src="${user.photoURL}" alt="" class="info__profile-img">
      </div>
      <div class="info__email">${user.email}</div>
    </div>
    `;

  headerUser.insertAdjacentHTML("afterbegin", USER_INFO_STR);
  headerUser.classList.toggle("invisible");
});

googleLoginBtn.addEventListener('click', async e => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await auth.signInWithPopup(provider);

  const token = result.credential.accessToken;
  const user = result.user;

  // 유저 정보 표시
  const USER_INFO_STR = `
    <div class="user__info clearfix">
      <div class="info__display-name">${user.displayName}</div>
      <div class="info__profile-img-wrapper">
        <img src="${user.photoURL}" alt="" class="info__profile-img">
      </div>
      <div class="info__email">${user.email}</div>
    </div>
    `;
  headerUser.insertAdjacentHTML("afterbegin", USER_INFO_STR);
  headerUser.classList.toggle("invisible");
})


/* Sign Out */

signOutBtn.addEventListener('click', async e => {
  auth.signOut()
    .then(() => {
      const userInfo = document.querySelector(".user__info");
      userInfo.remove();
    });
});


// 로그인 중인 유저가 있으면 로그인 버튼을 숨기고, 없으면 로그아웃 버튼을 숨긴다.
auth.onAuthStateChanged(user => {
  if (user) {
    userSignIn.classList.add('invisible');
    userSignOut.classList.remove('invisible');
    userBtn.textContent = 'MyInfo'
  } else {
    userSignIn.classList.remove('invisible');
    userSignOut.classList.add('invisible');
    userBtn.textContent = 'Login'
  }
})


/** 도시 검색 **/
// debounce
let timeoutId;

function debounce(cb, time) {
  return function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      cb();
      timeoutId = null;
    }, time);
  };
}

/* Search */
citySelect.addEventListener('click', e => {
  locationSearch.classList.toggle("invisible");
  enumSearchHistory();
})


searchInput.addEventListener('input', e => {
  const debounceListener = debounce(async() => {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${e.target.value}&APPID=6c80032342ac8a4aecd41a0bbd4bdc18`)
    const data = await res.json()
    citySelect.textContent = data.name;
    weatherDegree.textContent = `${Math.floor(data.main.temp - 273)}°`;
    weatherCondition.textContent = data.weather[0].main;

    let country;

    switch (data.sys.country) {
      case 'JP':
        country = 'Japan';
        break;
      case 'KR':
        country = 'South Korea';
        break;
      case 'GB':
        country = 'United Kingdom';
        break;
      case 'US':
        country = 'USA';
        break;
      case 'CN':
        country = 'CHINA';
        break;
      case 'MY':
        country = 'SINGAPORE';
        break;
      case 'FR':
        country = 'France';
        break;
      case 'ES':
        country = 'Spain';
        break;
      case 'IT':
        country = 'Italy';
        break;
      case 'TH':
        country = 'Thailand';
        break;
      case 'UA':
        country = 'Ukraine';
        break;
      case 'DE':
        country = 'Germany';
        break;
      case 'KP':
        country = 'North Korea';
        break;
        break;
      default:
    }

    locationCountry.textContent = country || data.sys.country;

    const uid = auth.currentUser ? auth.currentUser.uid : null;
    if (uid) {
      await database.ref(`/users/${uid}/regions`).push({
        city: citySelect.textContent,
        country: country
      })
    }

    // const listEl = document.createElement("li");
    // listEl.innerHTML = `
    //     ${citySelect.textContent}, <span>${country}</span>
    //     `;
    // const buttonEl = document.createElement("button");
    // buttonEl.textContent = "삭제";
    // buttonEl.classList.add("history__delete-button");
    // buttonEl.addEventListener("click", e => {

    //   const snapshot = await database.ref(`/users/${uid}/regions`).once('value');
    //   const datas = snapshot.val();
    //   const countryId = Object.keys(datas)
    //   database.ref(`/users/${uid}/regions/${countryId}`).remove();
    //   e.currentTarget.parentNode.remove();
    // });
    // searchHistory.appendChild(listEl);
    // listEl.appendChild(buttonEl);

    // searchHistory.appendChild();
  }, 1000);
  debounceListener();
});

init();
