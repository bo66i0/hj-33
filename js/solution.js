'use strict';
let webSocket;

const url = 'https://neto-api.herokuapp.com/pic';

class Menu {
  constructor() {
    this.menuDrag = document.querySelector('.drag');
    this.container = document.querySelector('.menu');
    this.drawTools = document.querySelector('.draw-tools');
    this.colorButtons = Array.from(document.querySelectorAll('.menu__color'));
    this.draw = document.querySelector('.draw');
    this.uploadNew = document.querySelector('.new');
    this.comments = document.querySelector('.comments');
    this.commentsTools = document.querySelector('.comments-tools');
    this.share = document.querySelector('.share');
    this.shareTools = document.querySelector('.share-tools');
    this.burgerMenu = document.querySelector('.burger');
    this.commentsToggle = document.querySelector('.menu__toggle-bg');
    this.tools = Array.from(document.querySelectorAll('.tool'));
    this.modes = Array.from(document.querySelectorAll('.mode'));
    this.state = '';
    this.shiftX = 0;
    this.shiftY = 0;
    this.isMoving = false;
  }

  drag(event) {
    this.isMoving = true;
    const bounds = this.container.getBoundingClientRect();
    this.shiftX = event.pageX - bounds.left-window.pageXOffset;
    this.shiftY = event.pageY - bounds.top-window.pageYOffset;
  }

  moveMenu(event)  {
    if (this.isMoving) {
      event.preventDefault();
      const bounds = this.container.getBoundingClientRect();
      const menuWidth = bounds.width;
      const menuHeight = bounds.height;
      let x = event.pageX;
      let y = event.pageY;
      const minX = this.shiftX;
      const minY = this.shiftY;
      const maxX = window.innerWidth - menuWidth + this.shiftX;
      const maxY = window.innerHeight - menuHeight + this.shiftY;
      x = Math.min(x, maxX);
      y = Math.min(y, maxY);
      x = Math.max(x, minX);
      y = Math.max(y, minY);
      this.container.style.left = `${x - this.shiftX}px`;
      this.container.style.top = `${y - this.shiftY}px`;
    }
  }

  setLeftTop() {
    if (localStorage.left && localStorage.top) {
      this.container.style.setProperty('--menu-left', localStorage.left);
      this.container.style.setProperty('--menu-top', localStorage.top);
    }
  }

  drop(event) {
    this.isMoving = false;
    localStorage.left = this.container.style.left;
    localStorage.top = this.container.style.top;
  }

  setState(state, mode) {
    this.modes.forEach(el => el.dataset.state = '');
    if (state) {
      this.container.dataset.state = state;
      this.state = state;
      if (mode) {
        mode.dataset.state = state;
      }
    } else {
      this.container.dataset.state = '';
      this.state = '';
    }
  }

  onMenuClick(event) {
    let target = event.target;
    while (!(target.classList.contains('mode'))) {
      if (target.classList.contains('menu')) return;
      target = target.parentElement;
    }

    console.log(target);
    this.setState('selected', target);
  }

  onBurgerMenuClick(event) {
    this.setState('default');
  }

  showError() {
    const  error = document.querySelector('.error');
    error.style.display = 'block';
    setTimeout(() => {
      error.style.display = 'none';
    }, 5000)
  }

  isFileTypeRight(file) {
    const types = ['image/jpeg','image/png'];
    return types.includes(file.type);
  }


  uploadImage() {
    const imgReader = document.createElement('input');
    imgReader.type = 'file';
    imgReader.click();
    imgReader.addEventListener('change', (event) => {
      const files = Array.from(event.target.files);
      if (this.isFileTypeRight(files[0])) {
        const formData = new FormData;
        formData.append('title', imgReader.files[0].name);
        formData.append('image', imgReader.files[0]);
        canvas.showPreloader();
        fetch(url, {
          method: 'POST',
          body: formData
        }).then(res => res.json())
          .then(image => {
            fetch(`${ url }/${ image.id }`)
              .then(res => res.json())
              .then(data => {
                canvas.setImageSrc(data.url);
                let url = `wss:neto-api.herokuapp.com/pic/${ data.id }`
                let ws = new WebSocket(url);
                ws.addEventListener('open', event => console.log('hui'));
                ws.addEventListener('message', event => mask.wsEventMessage(event, ws, url));
                ws.addEventListener('close', event => console.log('zakrito'));
                webSocket = ws;
              })
          })
      } else this.showError();
    })
  }

  init() {
    this.setState('initial');
    this.setLeftTop();
  }

  initEvents() {
    this.menuDrag.addEventListener('mousedown', this.drag.bind(this));
    document.addEventListener('mousemove', this.moveMenu.bind(this));
    document.addEventListener('mouseup', this.drop.bind(this));
    this.container.addEventListener('click', this.onMenuClick.bind(this));
    this.burgerMenu.addEventListener('click', this.onBurgerMenuClick.bind(this));
    this.uploadNew.addEventListener('click', this.uploadImage.bind(this));
    this.colorButtons.forEach(color => {
      color.addEventListener('click',  mask.setColor);
    })
  }
}

class Canvas {
  constructor() {

  }

  setImageSrc(src) {
    mask.img.src = src;
  }

  showPreloader() {
    document.querySelector('.image-loader').style.display = 'block'
  }

  hidePreloader() {
    document.querySelector('.image-loader').style.display = 'none'
  }
}

class Mask {
  constructor() {
    this.img = document.querySelector('.current-image');
    this.wrapBox = this.createImageWrap();
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.pointsList = [];
    this.BRUSH_RADIUS = 4;
    this.needRepaint = false;
    this.pointsToDeleteAmount = null;
    this.colors = {
      red: '#ea5d56',
      yellow: '#f3d135',
      green: '#6cbe47',
      blue: '#53a7f5',
      purple: '#b36ade'
    }
  }

  createImageWrap() {
    const wrapBox = document.createElement('div');
    const mask = document.createElement('img');
    mask.style.position = 'absolute';
    mask.style.top = '50%';
    mask.style.left = '50%';
    mask.style.transform = 'translate(-50%, -50%)';
    mask.classList.add('mask');
    mask.style.border = 'none';
    mask.src = 'i/mask.png';
    document.querySelector('.menu').after(wrapBox);
    wrapBox.classList.add('image-wrapper');
    wrapBox.style.left = '50%';
    wrapBox.style.top = '50%';
    wrapBox.style.transform = 'translate(-50%, -50%)';
    wrapBox.style.position = 'absolute';
    wrapBox.appendChild(this.img);
    wrapBox.appendChild(mask);
    this.img.style.position = 'relative';
    return wrapBox;
  }

  setMaskSrc(src) {
    document.querySelector('.mask').src = src;
  }

  setMaskSize(){
    document.querySelector('.mask').width = this.img.width;
    document.querySelector('.mask').height = this.img.height;
  }

  setColor(event) {
    mask.ctx.strokeStyle = mask.colors[event.currentTarget.value];
    mask.ctx.fillStyle = mask.colors[event.currentTarget.value];
  }

  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '10';
    this.img.after(canvas);
    return canvas;
  }

  drawCircle(point) {
      mask.ctx.lineWidth = mask.BRUSH_RADIUS;
      mask.ctx.beginPath();
      mask.ctx.fillStyle = point.color;
      mask.ctx.arc(point.x, point.y, mask.ctx.lineWidth / 2, 0, 2 * Math.PI);
      mask.ctx.fill();
  }

  drawLine(p1, p2) {
      const cp = new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, p1.color);
      this.ctx.quadraticCurveTo(p1.x, p1.y, cp.x, cp.y);
  }


  drawPoints(points) {
    mask.ctx.beginPath();
    mask.ctx.strokeStyle = points[0].color;
    mask.lineWidth = mask.BRUSH_RADIUS;
    mask.lineJoin = 'round';
    mask.lineCap = 'round';
    mask.ctx.moveTo(points[0].x, points[0].y);

    for(let i = 1; i < points.length - 1; i++) {
      mask.drawLine(points[i], points[i + 1]);
    }
    mask.ctx.stroke();
  }

  repaint() {
    mask.ctx.clearRect(0, 0, mask.canvas.width, mask.canvas.height);

    mask.pointsList
      .forEach((curve) => {
        mask.drawCircle(curve[0]);
        mask.drawPoints(curve);
      });
  }

  tick () {
    if(mask.needRepaint) {
      mask.repaint();
      mask.needRepaint = false;
    }

    window.requestAnimationFrame(mask.tick.bind(this));
  }

  maskMouseDown(event) {
    if (menu.draw.dataset.state === 'selected') {
      mask.isDrawing = true;
      mask.needRepaint = true;
      const thisPoints = [];
      const color = mask.ctx.fillStyle;
      thisPoints.push({
        x: event.clientX - mask.canvas.getBoundingClientRect().left,
        y: event.clientY - mask.canvas.getBoundingClientRect().top,
        color: color
      });
      mask.pointsList.push(thisPoints);
    }
  }

  maskMouseMove(event) {
    if (mask.isDrawing) {
      mask.needRepaint = true;
      const color = mask.ctx.fillStyle;
      mask.pointsList[mask.pointsList.length - 1].push({
        x: event.clientX - mask.canvas.getBoundingClientRect().left,
        y: event.clientY - mask.canvas.getBoundingClientRect().top,
        color: color
      });
    }
  }

  maskMouseUp() {
    mask.isDrawing = false;
    mask.needRepaint = false;
  }


  updateCanvasSize() {
    this.canvas.width = this.img.width;
    this.canvas.height = this.img.height;
  }

  reOpenWs(event, ws, url) {
    ws.close();
    ws = new WebSocket(url);
    ws.addEventListener('open', event => console.log('hui'));
    ws.addEventListener('message', mask.newWsEventMessage);
    ws.addEventListener('error', (event) => console.log('errorsuka'));
    ws.addEventListener('close', event => console.log('zakrito'));
    webSocket = ws;
  }

  wsEventMessage(event, ws, url) {
    console.log(JSON.parse(event.data));
    if (JSON.parse(event.data).event === 'mask') {
      mask.setMaskSrc(JSON.parse(event.data).url);
      mask.pointsList.splice(0, mask.pointsToDeleteAmount);
      mask.reOpenWs(event, ws, url)
    }
  }

  newWsEventMessage(event) {
    console.log(JSON.parse(event.data).event);
    if (JSON.parse(event.data).event === 'mask') {
      mask.setMaskSrc(JSON.parse(event.data).url);
      mask.pointsList.splice(0, mask.pointsToDeleteAmount);
    }
  }

  initEvents() {
    this.img.addEventListener('load', this.updateCanvasSize.bind(this));
    this.img.addEventListener('load', canvas.hidePreloader);
    this.img.addEventListener('load', this.setMaskSize.bind(this));
    this.canvas.addEventListener('mousedown', this.maskMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.maskMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.maskMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.maskMouseUp.bind(this));
  }
}

function Point(x, y, color) {
  this.x = x;
  this.y = y;
  this.color = color;
}

const canvas = new Canvas;
const mask = new Mask();
const menu = new Menu();
menu.init();
menu.initEvents();
mask.initEvents();
mask.tick();

function updateMaskImage() {
  setInterval(() => {
    if (webSocket) {
      mask.canvas.toBlob((blob) => webSocket.send(blob));
      if (mask.isDrawing) {
        mask.pointsToDeleteAmount = mask.pointsList.length - 1;
      } else {
        mask.pointsToDeleteAmount = mask.pointsList.length
      }
    }

  }, 5000)
}

updateMaskImage();
