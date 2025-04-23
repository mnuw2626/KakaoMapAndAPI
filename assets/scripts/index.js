
// xml 파일을 JSON 형태로 변환시키는 함수
function xmlToJson(xml) {
    if (typeof xml === 'string') {
        xml = (new DOMParser()).parseFromString(xml, 'text/xml');
    }
    // Create the return object
    let obj = {};

    if (xml.nodeType == 1) {
        // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (let j = 0; j < xml.attributes.length; j++) {
                let attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) {
        // text
        obj = xml.nodeValue;
    }

    // do children
    // If all text nodes inside, get concatenated text from them.
    let textNodes = [].slice.call(xml.childNodes).filter(function(node) {
        return node.nodeType === 3;
    });
    if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
        obj = [].slice.call(xml.childNodes).reduce(function(text, node) {
            return text + node.nodeValue;
        }, "");
    } else if (xml.hasChildNodes()) {
        for (let i = 0; i < xml.childNodes.length; i++) {
            let item = xml.childNodes.item(i);
            let nodeName = item.nodeName;
            if (typeof obj[nodeName] == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof obj[nodeName].push == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}

// 카카오 지도 관련
const $map = document.getElementById('map');

// 카카오 지도 생성
const map = new kakao.maps.Map($map, {
    center: new kakao.maps.LatLng(35.8715411, 128.601505),
    level: 3
});

// 기존 마커들을 저장 -> 중심 좌표를 옮겼을 시 기존 마커들을 지우고 다시 그리기 위해서
const markers = [];

// 의사클래스 scope를 이용해서 body의 자식 .loading만 가져옴
const $loading = document.body.querySelector(':scope > .loading');

const showLoading = () => $loading.classList.add('--visible');
const hideLoading = () => $loading.classList.remove('--visible');


// 기존 코드 유지 여부
let isFiltered = false; // 필터링 여부를 나타내는 플래그

// 검색 관련
const $filter = document.getElementById('filter');
const $filterForm = $filter.querySelector(':scope > .form');
const $filterList = $filter.querySelector(':scope > .list');
// 검색 결과를 넣을 빈 배열
const filteredHospitals = [];

// form 태그에서 submit이 발생했을 시
$filterForm.onsubmit = (e) => {
    // form 태그의 submit 이벤트(데이터를 보내고 새로고침)를 방지함
    e.preventDefault();
    // form태크['name값'] 을 적을 시 form에 있는 input태그에 접근 가능
    const nameValue = $filterForm['name'].value;
    const categoryValue = $filterForm['category'].value;
    // console.log(`이름은 ${nameValue}, 구분은 ${categoryValue}`);
    filteredHospitals.splice(0, filteredHospitals.length); // 검색 초기화

    for (const hospital of hospitals) {
        // 병원의 이름(hospital.name)이 nameValue를 포함하고
        // 병원의 구분(hospital.categoryCode)이 categoryValue와 동일하거나 '00'일 경우
        if( hospital.name.includes(nameValue) &&
            categoryValue === '00' || categoryValue === hospital.categoryCode) {
            // console.log(hospital.name);
            // console.log(hospital.categoryCode);
            filteredHospitals.push(hospital);
        }
    }

    // 기존 목록 지움
    $filterList.innerHTML = '';

    // 기존 마커들을 없앰
    markers.forEach((marker) => marker.setMap(null))

    // 새로운 목록과 마커를 생성 및 설정
    filteredHospitals.forEach( (hospital) => addItem(hospital) );

    // 필터링 상태 업데이트
    isFiltered = true; // 필터링 상태를 true로 설정
};

// 해당 목록과 지도 마커를 html에 표시하는 함수
const addItem = (hospital) => {
    const $name = document.createElement('span');
    $name.classList.add('name');
    $name.innerText = hospital['name'];

    const $category = document.createElement('span');
    $category.classList.add('category');
    $category.innerText = hospitalCategorgMap[hospital['categoryCode']];

    const $nameWrapper = document.createElement('span');
    $nameWrapper.classList.add('name-wrapper');
    $nameWrapper.append($name, $category);

    const $address = document.createElement('span');
    $address.classList.add('address');
    $address.innerText = hospital['address'];

    const $contact = document.createElement('a');
    $contact.classList.add('contact');
    $contact.href = `tel:${hospital['contact']}`;
    $contact.innerHTML = `<i class="fa-solid fa-phone"></i>${hospital['contact']}`;

    const $homepage = document.createElement('a');
    $homepage.classList.add('homepage');
    $homepage.href = hospital['homepage'];
    $homepage.target = '_blank';
    $homepage.innerHTML = `<i class="fa-solid fa-globe"></i>${hospital['homepage']}`;


    const $item = document.createElement('li');
    $item.classList.add('item');

    // if(hospital['homepage'] === undefined){
    //     $item.append($nameWrapper, $address, $contact);
    // }else{
    //     $item.append($nameWrapper, $address, $contact, $homepage);
    // }
    $item.append($nameWrapper, $address, $contact);
    hospital['homepage'] && $item.append($homepage);

    $filterList.append($item);

    /*
    // 마커가 표시될 위치
    let markerPosition  = new kakao.maps.LatLng(hospital['longitude'],hospital['latitude']);

    // // 마커를 생성
    let marker = new kakao.maps.Marker({
        position: markerPosition
    });
    */
    // 한번에도 가능함, 생성과 표시될 위치
    let marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(hospital.latitude, hospital.longitude)
    });

    // 마커가 지도 위에 표시되도록 설정
    marker.setMap(map);
    markers.push(marker);
}

// 병원정보데이터가 코드값으로 와서 그 코드값에 해당하는 병원종류(문자열)를 매칭시킴
const hospitals = []; // 병원정보데이터를 담을 빈 배열
const hospitalCategorgMap = {
    '01' : '상급종합병원',
    '11' : '종합병원',
    '21' : '병원',
    '28' : '요양병원',
    '29' : '정신병원',
    '31' : '의원',
    '41' : '치과병원',
    '51' : '치과의원',
    '61' : '조산원',
    '71' : '보건소',
    '72' : '보건지소',
    '73' : '보건진료소',
    '74' : '모자보건센타',
    '75' : '보건의료원',
    '81' : '약국',
    '91' : '한방종합병원',
    '92' : '한방병원',
    '93' : '한의원',
    '94' : '한약방',
    'AA' : '병의원'
};

// form 태그의 이름이 category 인 input에 목록 추가
Object.keys(hospitalCategorgMap).forEach(key => {
    const text = hospitalCategorgMap[key];
    const $option = document.createElement('option');
    $option.innerText = text; // 보이는 목록은 문자열로 보임
    $option.value = key; // 실제 값은 00 같은 코드로, 검색 시 실제론 코드값을 비교
    $filterForm['category'].append($option);
});


// 경계 내 병원 추가 함수 (목록, 마커 생성 및 추가)
const addHospitalsInBounds = (hospitalsList) => {
    const mapBounds = map.getBounds();
    const swPos = mapBounds.getSouthWest();
    const nePos = mapBounds.getNorthEast();
    const minLat = swPos.getLat();
    const minLng = swPos.getLng();
    const maxLat = nePos.getLat();
    const maxLng = nePos.getLng();

    hospitalsList.forEach((hospital) => {
        if (hospital.latitude > minLat &&
            hospital.latitude < maxLat &&
            hospital.longitude > minLng &&
            hospital.longitude < maxLng) {
            addItem(hospital);
        }
    });
};

// 사이트 접속 시 실행
const loadData = () => {
    hospitals.splice(0, hospitals.length); // 배열 초기화
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        // 통신이 종료되었는 지 확인
        if(xhr.readyState !== XMLHttpRequest.DONE){
            return;
        }

        hideLoading(); // 통신이 종료되면 로딩화면 없앰

        // 통신 상태가 정상이 아니면
        if (xhr.status < 200 || xhr.status >= 300){
            // TODO 실패 처리 로직 작성
            return;
        }
        const response = xmlToJson(xhr.responseText);
        // console.log(response);
        /* response 데이터 예시
        XPos: "128.6047030"
        YPos: "35.8662525"
        addr: "대구광역시 중구 동덕로 130, (삼덕동2가, 경북대학교병원)"
        clCd: "01"
        clCdNm: "상급종합"
        cmdcGdrCnt: "0"
        cmdcIntnCnt: "0"
        cmdcResdntCnt: "0"
        cmdcSdrCnt: "0"
        detyGdrCnt: "0"
        detyIntnCnt: "0"
        detyResdntCnt: "0"
        detySdrCnt: "1"
        drTotCnt: "240"
        emdongNm: "삼덕동2가"
        estbDd: "19100907"
        hospUrl: "http://knumc.knu.ac.kr"
        mdeptGdrCnt: "4"
        mdeptIntnCnt: "1"
        mdeptResdntCnt: "21"
        mdeptSdrCnt: "213"
        pnursCnt: "0"
        postNo: "41944"
        sgguCd: "230006"
        sgguCdNm: "대구중구"
        sidoCd: "230000"
        sidoCdNm: "대구"
        telno: "053-200-5114"
        yadmNm: "경북대학교병원"
        ykiho: "JDQ4MTYyMiM4MSMkMSMkMCMkODkkMzgxMzUxIzExIyQxIyQzIyQ3OSQyNjEwMDIjNzEjJDEjJDgjJDgz
        */
        for (const hospitalObject of response['response']['body']['items']['item']) {
            // 필요한 데이터만 빼와서 보기 좋게 재가공
            hospitals.push({
                name: hospitalObject['yadmNm'], // 병원 이름
                categoryCode: hospitalObject['clCd'], // 병원 구분 코드
                latitude: hospitalObject['YPos'], // 위도
                longitude: hospitalObject['XPos'], // 경도
                address: hospitalObject['addr'], // 주소
                addressPostal: hospitalObject['postNo'], // 우편번호
                contact: hospitalObject['telno'], // 전화번호
                homepage: hospitalObject['hospUrl'], // 홈페이지 주소
                totalDoctorsCount: hospitalObject['drTotCnt'], // 전체 의사 수
            });
        }

        $filterList.innerHTML = '';

        // 경계 내 병원추가 함수 사용하여 병원 리스트 및 마커 추가
        addHospitalsInBounds(hospitals);
    };
    xhr.open('GET', 'http://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList?serviceKey=26tigEnuGJBO%2BMQY3%2FRqlTWryjR0qImQ1GLLjglg7%2FJ6Cpme1vEdBG%2BH5yJkw%2BPEwljti36DWZdJmq8Od810bQ%3D%3D&sidoCd=230000&numOfRows=1000');

    // 학원 내에서 사용할 때
    // xhr.open('GET', 'http://192.168.4.252:8080/B551182/hospInfoServicev2/getHospBasisList?serviceKey=26tigEnuGJBO%2BMQY3%2FRqlTWryjR0qImQ1GLLjglg7%2FJ6Cpme1vEdBG%2BH5yJkw%2BPEwljti36DWZdJmq8Od810bQ%3D%3D&sidoCd=230000');
    xhr.send();
    showLoading();
};


// zoom_changed : 옮기는 와중에 계속 실행
// dragend : 옮기기 끝나고 딱 한번 실행
// dragend와 zoom_changed 이벤트를 처리 하기 위해서 forEach문을 사용함
['dragend', 'zoom_changed'].forEach( (event) => kakao.maps.event.addListener(map, event, () => {

    // 기존 마커들을 없앰
    for (const maker of markers) {
        maker.setMap(null);
    }

    // 기존에 있는 목록 없앰
    $filterList.innerHTML = '';

    // 필터링 상태에 따라 동작 변경
    if (isFiltered) {
        // 검색한 경우 검색 목록 기준으로
        addHospitalsInBounds(filteredHospitals);
    } else {
        // 검색하지 않은 경우 원래 동작
        addHospitalsInBounds(hospitals);
    }
}) );

loadData();