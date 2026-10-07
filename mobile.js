/* novelED 모바일 대응 스크립트 — 기존 코드는 건드리지 않고 위에 얹어서 동작 */
(function(){
  'use strict';
  var isNavDrawer=function(){return window.matchMedia('(max-width:900px),(hover:none)').matches;};

  // 1) 뷰포트: 노치/하단 바 안전영역 사용
  var vp=document.querySelector('meta[name="viewport"]');
  if(vp&&vp.content.indexOf('viewport-fit')<0)vp.content+=', viewport-fit=cover';

  // 2) 사이드바: hover 대신 햄버거 버튼 + 어두운 배경 탭으로 열고 닫기
  var btn=document.createElement('button');
  btn.className='m-menu-btn';btn.type='button';btn.setAttribute('aria-label','메뉴 열기');
  btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var overlay=document.createElement('div');overlay.className='m-nav-overlay';
  document.body.appendChild(btn);document.body.appendChild(overlay);
  var setNav=function(open){document.body.classList.toggle('nav-open',open);};
  btn.addEventListener('click',function(){setNav(!document.body.classList.contains('nav-open'));});
  overlay.addEventListener('click',function(){setNav(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setNav(false);});
  var nav=document.getElementById('main-nav');
  if(nav)nav.addEventListener('click',function(e){
    // 메뉴 항목을 누르면 페이지 이동 후 서랍 닫기 (로그인/백업 버튼 등은 열어둠)
    if(e.target.closest('.nav-item'))setNav(false);
  });
  // 터치에서 탭하면 hover가 켜져 서랍이 멋대로 열리는 것 방지
  ['showNav','hideNav'].forEach(function(name){
    var orig=window[name];
    window[name]=function(){if(isNavDrawer())return;if(typeof orig==='function')orig.apply(this,arguments);};
  });

  // 3) 터치 드래그앤드롭: 길게(0.3초) 누른 뒤 끌면 칸반·투두·위클리·러프메모 이동
  if(window.MobileDragDrop){
    var cfg={holdToDrag:300};
    if(MobileDragDrop.scrollBehaviourDragImageTranslateOverride)
      cfg.dragImageTranslateOverride=MobileDragDrop.scrollBehaviourDragImageTranslateOverride;
    MobileDragDrop.polyfill(cfg);
    // iOS Safari에서 끄는 동안 화면이 같이 스크롤되는 것을 막기 위한 필수 코드
    window.addEventListener('touchmove',function(){},{passive:false});
  }

  // 4) 일정표 블록 크기 조절: 아래쪽 손잡이를 손가락으로 끌기
  document.addEventListener('touchstart',function(e){
    var h=e.target.closest&&e.target.closest('[onmousedown^="startResizeBlock"]');
    if(!h)return;
    var m=(h.getAttribute('onmousedown')||'').match(/startResizeBlock\(event,(\d+)\)/);
    if(!m)return;
    var id=parseInt(m[1],10);
    var b=timeBlocks.find(function(x){return x.id===id;});
    var el=document.getElementById('tb-'+id);
    if(!b||!el)return;
    e.preventDefault();e.stopPropagation();
    var ROW_H=52,startY=e.touches[0].clientY,startDur=b.duration;
    var move=function(ev){
      ev.preventDefault();
      var dy=ev.touches[0].clientY-startY;
      b.duration=Math.max(10,startDur+Math.round(dy/(ROW_H/60)/10)*10);
      el.style.height=Math.max(18,b.duration*(ROW_H/60))+'px';
    };
    var end=function(){
      document.removeEventListener('touchmove',move);
      document.removeEventListener('touchend',end);
      document.removeEventListener('touchcancel',end);
      save('ned_timeblocks',timeBlocks);
      syncTodoTimeFromBlock(b);
      renderTimeSchedule();
    };
    document.addEventListener('touchmove',move,{passive:false});
    document.addEventListener('touchend',end);
    document.addEventListener('touchcancel',end);
  },{passive:false,capture:true});

  // 5) 앱으로 돌아왔을 때(다른 앱 갔다 온 뒤) 타이머 표시를 즉시 갱신
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='visible'&&typeof syncTimerDisplays==='function'){
      syncTimerDisplays();
      if(typeof renderTimeSchedule==='function')renderTimeSchedule();
    }
  });

  // 6) 홈 화면 앱(PWA)용 서비스 워커 등록 (https 또는 localhost에서만)
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('sw.js').catch(function(err){console.warn('SW 등록 실패',err);});
    });
  }
})();
