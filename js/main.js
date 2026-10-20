const header = document.querySelector('.header'),
    menuButton = document.querySelector('.menu-toggle'),
    navigation = document.querySelector('.gnb'),
    narrowScreen = window.matchMedia('(max-width: 1024px)');

function setMenu(open) {
    header.classList.toggle('menu-open', open);
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
}

menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
        setMenu(false);
        menuButton.focus();
    }
});

narrowScreen.addEventListener('change', () => {
    setMenu(false);
});

function todayString(now = new Date()) {
    return now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
}

function selectedProgram(search) {
    const value = new URLSearchParams(search).get('program');
    return ['cafe', 'party', 'class'].includes(value) ? value : 'cafe';
}

function validPhone(value) {
    const digits = value.replace(/\D/g, '');
    return /^[0-9+()\s-]+$/.test(value) && digits.length >= 9 && digits.length <= 15;
}

function reservationRows(values) {
    const programs = {
        cafe: '카페 이용',
        party: '생일파티',
        class: '원데이 클래스'
    },
        sizes = {
            small: '소형견',
            medium: '중형견'
        };

    return [
        ['예약자', values.userName],
        ['연락처', values.phone],
        ['희망 날짜', values.date],
        ['희망 시간', values.time],
        ['방문 인원', values.people + '명'],
        ['프로그램', programs[values.program]],
        ['반려견', values.dogName],
        ['크기', sizes[values.dogSize]],
        ['요청사항', values.message.trim() || '없음']
    ];
}

const form = document.querySelector('#reserve-form');

if (form) {
    const date = form.querySelector('#date'),
        time = form.querySelector('#time'),
        phone = form.querySelector('#phone'),
        program = form.querySelector('#program'),
        formStatus = document.querySelector('#form-status'),
        dialog = document.querySelector('#booking-dialog'),
        summary = document.querySelector('#booking-summary');

    date.min = todayString();
    program.value = selectedProgram(window.location.search);

    function updateTimes(now = new Date()) {
        date.min = todayString(now);

        const current = String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');

        let available = 0;

        [...time.options].forEach(option => {
            if (!option.value) return;

            option.disabled = date.value === date.min && option.value <= current;
            if (!option.disabled) available++;
        });

        if (time.selectedOptions[0]?.disabled) time.value = '';

        formStatus.textContent = date.value === date.min && !available
            ? '오늘은 선택할 수 있는 시간이 없습니다. 다른 날짜를 선택해 주세요.'
            : '';
    }

    date.addEventListener('change', () => {
        updateTimes();
    });

    phone.addEventListener('input', () => {
        phone.setCustomValidity('');
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        updateTimes();

        phone.setCustomValidity(
            validPhone(phone.value) ? '' : '연락처를 9~15자리 숫자로 입력해 주세요.'
        );

        ['userName', 'dogName'].forEach(name => {
            form.elements[name].value = form.elements[name].value.trim();
        });

        if (!form.reportValidity()) return;

        const values = {};

        new FormData(form).forEach((value, key) => {
            values[key] = String(value);
        });

        summary.replaceChildren();

        reservationRows(values).forEach(([label, value]) => {
            const term = document.createElement('dt'),
                description = document.createElement('dd');

            term.textContent = label;
            description.textContent = value;
            summary.append(term, description);
        });

        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    });

    function closeDialog() {
        if (typeof dialog.close === 'function') {
            dialog.close();
        } else {
            dialog.removeAttribute('open');
        }
    }

    document.querySelector('.dialog-close').addEventListener('click', closeDialog);
    document.querySelector('.dialog-edit').addEventListener('click', closeDialog);
}