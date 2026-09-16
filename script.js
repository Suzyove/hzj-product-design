/* ============================================================
   何卓键 · 作品集 — 交互脚本
   模块：导航 / 渐入 / 计数 / 灯箱 / 对比滑块 / 懒加载视频
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 导航状态 ---------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("navBurger");
  var navLinksBox = document.getElementById("navLinks");
  var progress = document.getElementById("scrollProgress");

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle("scrolled", y > 40);

    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";

    // 活跃链接追踪
    var sections = document.querySelectorAll("section[id], article[id]");
    var cur = "";
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= window.innerHeight * 0.35) cur = s.id;
    });
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + cur);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // 移动菜单
  burger.addEventListener("click", function () {
    var open = navLinksBox.classList.toggle("open");
    burger.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  navLinksBox.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      navLinksBox.classList.remove("open");
      burger.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  /* ---------- 2. 滚动渐入 ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var d = parseInt(e.target.getAttribute("data-delay") || "0", 10);
          setTimeout(function () { e.target.classList.add("visible"); }, reduceMotion ? 0 : d * 110);
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- 3. 数字计数 ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count") || "0", 10);
    if (reduceMotion) { el.textContent = target; return; }
    var dur = 1400, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- 4. 灯箱 ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbCounter = document.getElementById("lbCounter");
  var lbIndex = 0;

  function openLb(i) {
    lbIndex = (i + items.length) % items.length;
    var el = items[lbIndex];
    var img = el.querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt || "";
    lbCap.textContent = el.getAttribute("data-caption") || img.alt || "";
    lbCounter.textContent = (lbIndex + 1) + " / " + items.length;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLb() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  items.forEach(function (el, i) {
    el.addEventListener("click", function (ev) {
      ev.preventDefault();
      openLb(i);
    });
  });
  document.getElementById("lbClose").addEventListener("click", closeLb);
  document.getElementById("lbPrev").addEventListener("click", function () { openLb(lbIndex - 1); });
  document.getElementById("lbNext").addEventListener("click", function () { openLb(lbIndex + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") openLb(lbIndex - 1);
    if (e.key === "ArrowRight") openLb(lbIndex + 1);
  });

  /* ---------- 5. 渲染↔落地 对比滑块 ---------- */
  document.querySelectorAll(".compare").forEach(function (box) {
    var wrap = box.querySelector(".compare-after-wrap");
    var handle = box.querySelector(".compare-handle");
    var dragging = false;

    function setPos(clientX) {
      var rect = box.getBoundingClientRect();
      var pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0.03), 0.97);
      wrap.style.width = pct * 100 + "%";
      handle.style.left = pct * 100 + "%";
    }
    function startDrag(e) {
      dragging = true;
      box.querySelector(".compare-knob").style.cursor = "grabbing";
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      setPos(x);
      e.preventDefault();
    }
    function moveDrag(e) {
      if (!dragging) return;
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      setPos(x);
    }
    function endDrag() {
      dragging = false;
      box.querySelector(".compare-knob").style.cursor = "grab";
    }
    box.addEventListener("mousedown", startDrag);
    box.addEventListener("touchstart", startDrag, { passive: false });
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("touchmove", moveDrag, { passive: false });
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);
    // 键盘可访问
    box.setAttribute("tabindex", "0");
    box.setAttribute("role", "slider");
    box.setAttribute("aria-label", "对比渲染与落地效果");
    box.addEventListener("keydown", function (e) {
      var cur = parseFloat(wrap.style.width) || 50;
      if (e.key === "ArrowLeft") { wrap.style.width = Math.max(cur - 5, 3) + "%"; handle.style.left = wrap.style.width; }
      if (e.key === "ArrowRight") { wrap.style.width = Math.min(cur + 5, 97) + "%"; handle.style.left = wrap.style.width; }
    });
  });

  /* ---------- 6. 懒加载视频（进入视口才加载，节省带宽） ---------- */
  var videos = document.querySelectorAll(".lazy-video");
  if ("IntersectionObserver" in window) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src && v.getAttribute("data-src")) v.src = v.getAttribute("data-src");
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          if (v.src) v.pause();
        }
      });
    }, { rootMargin: "300px 0px", threshold: 0.15 });
    videos.forEach(function (v) { vo.observe(v); });
  } else {
    videos.forEach(function (v) {
      v.src = v.getAttribute("data-src");
      v.play().catch(function () {});
    });
  }
  // 建模区视频卡片：点击切换播放/暂停
  document.querySelectorAll(".model-video").forEach(function (cell) {
    cell.addEventListener("click", function () {
      var v = cell.querySelector("video");
      if (v.paused) v.play().catch(function () {}); else v.pause();
    });
  });
  // 产品区主视觉视频：点击切换播放/暂停（自动播放被拦截时的兜底）
  document.querySelectorAll(".prod-main video").forEach(function (v) {
    v.addEventListener("click", function () {
      if (v.paused) v.play().catch(function () {}); else v.pause();
    });
  });

})();
