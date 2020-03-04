
window.onload = function () {
    const search = window.location.search;
    const uuid = search.split('=')[1];
    chrome.runtime.sendMessage({
        name: "get_scrrenshot_png",
        id: uuid
    }, function (res) {
        const scrrenshot = new Scrrenshot(res.base64)
        const cp = ColorPicker(
            document.getElementById('color-picker'),
            function(hex, hsv, rgb, mouseSlide, mousePicker) {
                scrrenshot.changeActionColor(hex)
                ColorPicker.positionIndicators(
                    document.getElementById('slide-indicator'),
                    document.getElementById('picker-indicator'),
                    mouseSlide, mousePicker
                )
        });
        cp.setHex('#ff0000')
    })
}

window.onunload = function () {
    chrome.runtime.sendMessage({
        name: "del_scrrenshot_png",
        id: uuid
    })
}

class Scrrenshot {
    constructor(src){
        this.mousedown = this.mousedown.bind(this)
        this.mousemove = this.mousemove.bind(this)
        this.mouseup = this.mouseup.bind(this)
        this.src = src
        this.fillStyle = 'rgba(0,0,0,0.3)'
        this.lineWidth = '2'
        this.strokeStyle = 'rgb(0, 0, 0)'
        this.lineDash = [20, 10]

        this.mouseStatus = 0; // 鼠标 1按下； 0弹起
        this.clientX = 0; // 鼠标X坐标
        this.clientY = 0; // 鼠标Y坐标
        this.sPointX = 0 // 选取图像起始位置X坐标
        this.sPointY = 0 // 选取图像起始位置Y坐标
        this.prevWidth = 0 // 上一次图片width
        this.prevHeight = 0  // 上一次图片高度
        this.width = 0 // 选取图像宽度
        this.height = 0 // 选取图像高度
        this.maxWidth = 0 // 最大宽度
        this.maxHeight = 0 // 最大高度

        
        this.enlargement = document.getElementById('enlargement')
        this.sizeBox = document.getElementById('size')
        this.actionBox = document.getElementById('action')
        this.getAction = document.getElementById('getAction')

        this.actionStatus = 0 // 0 无； 1 方框； 2 铅笔； 3 箭头； 4 取色； 
        this.actionColor = '#ff0000'
        this.activeId = 'z'
        this.fc_sPointX = 0
        this.fc_sPointY = 0;
        this.fc_prevWidth = 0;
        this.fc_prevHeight = 0;

        this.initPage(src);


        document.onkeydown = (e) => {
            
            if (e.which === 27) {
                this.actionStatus = 0
                this.delActive()
            }
            if(this.actionStatus === 0) {
                window.close()
            }
        }

    }
    
    mousedown(e) {
        if(e.which !== 1) return
        this.mouseStatus = 1
        const {clientX, clientY} = e
        this.clientX = clientX
        this.clientY = clientY

        if (this.actionStatus === 0) { // 初始状态
            this.sPointX = clientX
            this.sPointY = clientY
            this.showEnlargement();
            this.updateEnlargement();
            this.showSize();
            this.hiddenAction();
            this.hiddenGetAction();
        } else if (this.actionStatus === 1) { 
            this.fc_sPointX = clientX
            this.fc_sPointY = clientY
            this.create_fk()
        } else if (this.actionStatus === 2 ) {
            this.create_qb()
        } else if (this.actionStatus === 3 ) {
            this.create_jt()
        } else if (this.actionStatus === 4 ) {
            this.create_text(clientX, clientY)
        } else if (this.actionStatus === 5) {
            this.hiddenColorPicker()
        }
        
    }
    mousemove(e) {
        if(this.mouseStatus === 1) {
            const {clientX, clientY} = e
            this.clientX = clientX
            this.clientY = clientY
            if(this.actionStatus === 0) {
                this.prevWidth = this.width
                this.prevHeight = this.height
                this.width = clientX - this.sPointX
                this.height = clientY - this.sPointY
                this.updateCanvas()
                this.updateEnlargement()
                this.updateSize()
            } else if (this.actionStatus === 1) {
                this.update_fk()
            } else if (this.actionStatus === 2 ) {
                this.update_qb()
            } else if (this.actionStatus === 3 ) {
                this.update_jt()
            } else if (this.actionStatus === 4 ) {
                
            }
        }
    }
    mouseup(e) {
        this.mouseStatus = 0
        if(this.actionStatus === 0) {
            this.hiddenEnlargement();
            if(this.width > 0 && this.height > 0) {
                this.showAction()
                this.showGetAction()
            }
        } else if (this.actionStatus === 1){

        } else if (this.actionStatus === 2 ) {

        } else if (this.actionStatus === 3 ) {
           
        } else if (this.actionStatus === 4 ) {
            this.edit_text()
        }
        
        
        // this.drawImage()
    }
    create_text(clientX, clientY) {
        this.activeId = `z${new Date().getTime()}`
        const div = document.createElement('div')
        document.getElementById('background').append(div)
        div.setAttribute('contenteditable', true)
        div.id = this.activeId
        div.style.display = 'inline-block'
        div.style.color = this.actionColor
        div.style.position = 'fixed'
        div.style.zIndex = 1
        div.style.left = clientX + 'px'
        div.style.top = clientY + 'px'
        div.style.minWidth = '50px'
        div.style.minHeight = '50px'
        div.style.padding = '10px'
    }
    edit_text(){
        const div = document.getElementById(this.activeId)
        div.focus()
    }
    create_jt() {
        const img = document.getElementById('source')
        this.activeId = `z${new Date().getTime()}`
        const canvas = document.createElement('canvas')
        canvas.id = this.activeId
        const width = this.maxWidth
        const height = this.maxHeight
        canvas.width = width
        canvas.height = height
        canvas.style.position = 'absolute'
        canvas.style.zIndex = '10'
        canvas.style.left = img.offsetLeft
        canvas.style.top = img.offsetTop
        document.getElementById('background').append(canvas)
        const ctx = canvas.getContext('2d')
        this.jt_ctx = ctx
        this.jt_ctx.lineWidth = 2
        this.jt_ctx.strokeStyle = this.actionColor
        this.jt_sPointX = this.clientX
        this.jt_sPointY = this.clientY
    }
    update_jt() {
            this.jt_ctx.clearRect(0, 0, this.maxWidth, this.maxHeight)
            this.jt_ctx.beginPath()  
            this.jt_ctx.moveTo(this.jt_sPointX, this.jt_sPointY) 
            this.jt_ctx.lineTo(this.clientX, this.clientY)
            const angle = Math.atan2((this.clientY-this.jt_sPointY), (this.clientX-this.jt_sPointX))
            const theta = angle*(180/Math.PI)
            this.jt_ctx.lineTo(
                this.clientX - Math.cos((11 + theta) * Math.PI / 180) * 30 , 
                this.clientY - Math.sin((11 + theta) * Math.PI / 180) * 30
            )
            // this.jt_ctx.moveTo(this.clientX, this.clientY) 
            this.jt_ctx.lineTo(
                this.clientX - Math.cos((11 - theta) * Math.PI / 180) * 30 ,
                this.clientY + Math.sin((11 - theta) * Math.PI / 180) * 30
            )
            this.jt_ctx.lineTo(this.clientX, this.clientY)
            this.jt_ctx.fillStyle = this.actionColor
            this.jt_ctx.fill()
            this.jt_ctx.stroke()           
    }
    create_qb() {
        const img = document.getElementById('source')
        this.activeId = `z${new Date().getTime()}`
        const canvas = document.createElement('canvas')
        canvas.id = this.activeId
        const width = this.maxWidth
        const height = this.maxHeight
        canvas.width = width
        canvas.height = height
        canvas.style.position = 'absolute'
        canvas.style.zIndex = '10'
        canvas.style.left = img.offsetLeft
        canvas.style.top = img.offsetTop
        document.getElementById('background').append(canvas)
        const ctx = canvas.getContext('2d')
        this.qb_ctx = ctx
        this.qb_ctx.lineWidth = 3
        this.qb_ctx.strokeStyle = this.actionColor
        this.qb_ctx.beginPath()  
        this.qb_ctx.moveTo(this.clientX, this.clientY) 
    }
    // timer_qb = null
    update_qb() {
            this.qb_ctx.lineTo(this.clientX, this.clientY)
            this.qb_ctx.stroke()
        // if(this.timer_qb) return
        // this.timer_qb = setTimeout( () => {
        //     this.qb_ctx.lineTo(this.clientX, this.clientY)
        //     this.qb_ctx.closePath()
        //     this.qb_ctx.stroke()
        //     this.qb_ctx.moveTo(this.clientX, this.clientY)
        //     clearTimeout(this.timer_qb)
        //     this.timer_qb = null
        // }, 5)
    }

    create_fk() {
        this.activeId = `z${new Date().getTime()}`
        const div = document.createElement('div')
        div.id = this.activeId
        div.style.position = 'fixed'
        div.style.zIndex = 1
        div.style.border = `2px solid ${this.actionColor}`
        div.style.left = this.fc_sPointX + 'px'
        div.style.top = this.fc_sPointY + 'px'
        document.getElementById('background').append(div)
    }
    update_fk() {
        const div = document.getElementById(this.activeId)
        const style = {
            left: this.fc_sPointX,
            top: this.fc_sPointY,
            width: this.clientX - this.fc_sPointX,
            height: this.clientY - this.fc_sPointY
        }
        if(style.width >= 0){
            div.style.left = style.left + 'px'
            div.style.right = 'auto'
            div.style.width = style.width + 'px'
        } else {
            div.style.right = document.documentElement.clientWidth - style.left + 'px'
            div.style.left = 'auto'
            div.style.width = -style.width + 'px'
        }
        if( style.height >= 0) {
            div.style.top = style.top + 'px'
            div.style.bottom = 'auto'
            div.style.height = style.height + 'px'
        } else {
            div.style.bottom = document.documentElement.clientHeight - style.top + 'px'
            div.style.top = 'auto'
            div.style.height = -style.height + 'px'
        }
    }
    updateCanvas() {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = this.fillStyle
        ctx.clearRect(0, 0, this.maxWidth, this.maxHeight)
        ctx.fillRect(0, 0, this.maxWidth, this.maxHeight)  
        ctx.beginPath()
        ctx.moveTo(this.sPointX, this.sPointY)
        ctx.lineTo(this.sPointX + this.width, this.sPointY)
        ctx.lineTo(this.sPointX + this.width, this.sPointY + this.height)
        ctx.lineTo(this.sPointX, this.sPointY + this.height)
        ctx.closePath()
        ctx.setLineDash(this.lineDash);
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.stroke()
        ctx.clearRect(this.sPointX, this.sPointY, this.width, this.height)
    }

    initPage(src) {
        const img = document.createElement('img')
        img.src = src
        img.id="source"
        img.onload = () => {
            this.initCanvas(img)
            this.initEnlargement()
            this.initSize()
            this.initAction()
            this.initGetAction()
        }
        document.getElementById('background').append(img)
    }
   
    
    initCanvas(img) {
        const canvas = document.getElementById('canvas');
        canvas.addEventListener('mousedown', this.mousedown)
        canvas.addEventListener('mousemove', this.mousemove)
        canvas.addEventListener('mouseup', this.mouseup)
        const width = this.maxWidth =  img.width;
        const height = this.maxHeight =  img.height;
        canvas.width = width
        canvas.height = height
        canvas.style.position = 'absolute'
        canvas.style.zIndex = '1000'
        canvas.style.left = img.offsetLeft
        canvas.style.top = img.offsetTop
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = this.fillStyle
        ctx.fillRect(0, 0, width, height)  
    }
    updateEnlargement() {
        return
        const left = this.clientX + 150 + 20 > this.maxWidth ? this.maxWidth - 150 - 20 : this.clientX + 20
        const top = this.clientY + 200 + 20 > this.maxHeight ? this.maxHeight - 200 -20 :  this.clientY + 20
        const style = this.enlargement.style
        style.left = left + 'px'
        style.top = top + 'px'
        style.backgroundImage = `url(${this.src})`
        style.backgroundSize = `${this.maxWidth * 5}px ${this.maxHeight * 5}px`
        style.backgroundPositionX = (-1 * this.clientX*5 + 75) + 'px'
        style.backgroundPositionY = (-1 * this.clientY*5 + 100) + 'px'
    }
    showEnlargement() {
        return
        this.enlargement.style.display = 'block'
    }
    hiddenEnlargement() {
        return
        this.enlargement.style.display = 'none'
    }
    initEnlargement() {
        return
        this.hiddenEnlargement();
    }
    initSize() {
        this.hiddenSize();
    }
    showSize() {
        this.sizeBox.style.display = 'block'
    }
    hiddenSize() {
        this.sizeBox.style.display = 'none'
    }
    updateSize() {
        const style = {
            top: this.sPointY - 40,
            left: this.sPointX
        }
        this.sizeBox.textContent = `${Math.abs(this.width)} x ${Math.abs(this.height)}`
        if(this.width < 0 ) {
            style.left = this.sPointX + this.width
        }
        if(this.height < 0 ) {
            style.top = this.sPointY + this.height - 40
        }
        if(style.top < 0) {
            style.top = 0 
        }
        if(style.left < 0) {
            style.left = 0
        }
        this.sizeBox.style.top = style.top + 'px'
        this.sizeBox.style.left = style.left + 'px'
    }
    initAction() {
        this.hiddenSize();
        this.actionBindEvent();
    }
    initGetAction() {
        this.getActionBingEvent()
        this.hiddenGetAction()
    }
    showAction() {
        this.updateAction()
        this.actionBox.style.display = 'block'
    }
    showGetAction() {
        this.updategetAction()
        this.getAction.style.display = 'block'
    }
    hiddenGetAction() {
        this.getAction.style.display = 'none'
    }
    hiddenAction() {
        this.actionBox.style.display = 'none'
    }
    updategetAction() {
        const style = {
            top: this.clientY + 10,
            left: this.clientX - 250
        }
        if(this.height < 0 ){
            style.top = this.clientY - this.height + 10
        }
        if(this.width < 0) {
            style.left = this.clientX - this.width - 250
        }
        if(style.top < 0) {
            style.top = 0
        }
        if(style.left + 30 > this.maxWidth) {
            this.left = this.maxWidth - 30
        } 
        this.getAction.style.top = style.top + 'px'
        this.getAction.style.left = style.left + 'px'
    }
    updateAction(){
        const style = {
            top: this.clientY - 190,
            left: this.clientX + 10
        }
        if(this.height < 0 ){
            style.top = this.clientY - this.height - 190
        }
        if(this.width < 0) {
            style.left = this.clientX - this.width + 10
        }
        if(style.top < 0) {
            style.top = 0
        }
        if(style.left + 30 > this.maxWidth) {
            this.left = this.maxWidth - 30
        } 
        this.actionBox.style.top = style.top + 'px'
        this.actionBox.style.left = style.left + 'px'
    }
    hiddenColorPicker() {
        const cpk = document.getElementById('color-picker')
        cpk.style.display = 'none'
    }
    getActionBingEvent() {
        const ok = document.getElementById('ok')
        const down = document.getElementById('down')
        const cancel = document.getElementById('cancel')
        ok.onclick = () => {
            this.copyImage()
        }
        down.onclick = () => {
            this.downImage()
        }
        cancel.onclick = () => {
            window.close();
        }
    }
    actionBindEvent() {
        const action_fk = document.getElementById('action_fk')
        const action_qb = document.getElementById('action_qb')
        const action_jt = document.getElementById('action_jt')
        const action_a = document.getElementById('action_a')
        const action_qs = document.getElementById('action_qs')
        const action_ht = document.getElementById('action_ht')
        action_fk.onclick = () => {
            this.hiddenColorPicker()
            this.actionStatus = 1
            this.delActive()
            action_fk.className='active'
        }
        action_qb.onclick = () => {
            this.actionStatus = 2
            this.hiddenColorPicker()
            this.delActive()
            action_qb.className='active'
        }
        action_jt.onclick = () => {
            this.actionStatus = 3
            this.hiddenColorPicker()
            this.delActive()
            action_jt.className='active'
        }
        action_a.onclick = () => {
            this.actionStatus = 4
            this.hiddenColorPicker()
            this.delActive()
            action_a.className='active'
        }
        action_qs.onclick = (e) => {
            if(e.target.id !== 'qs') return
            this.actionStatus = 5
            const cpk = document.getElementById('color-picker')
            if (cpk.style.display === 'block') {
                cpk.style.display = 'none'
            } else {
                cpk.style.display = 'block'
            }
            this.delActive()
        }
        action_ht.onclick = () => {
            this.hiddenColorPicker()
            const bg = document.getElementById('background')
            const bgLastChild = bg.lastChild
            if(bgLastChild.id === 'source') return
            bg.removeChild(bgLastChild)
        }
    }
    delActive(){
        const active = document.querySelector('#action .active')
        if(active) {
            active.className = ""
        }
    }
    changeActionColor(color) {
        this.actionColor = color
        document.getElementById('qs').style.backgroundColor = color
    }

    downImage() {
        html2canvas(document.body, {
            allowTaint: true,
            foreignObjectRendering: true
        }).then( (cvs) => {
            const url = cvs.toDataURL("image/png")
            const img = document.createElement('img')
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = this.width
                canvas.height = this.height
                const ctx = canvas.getContext('2d')
                console.log(this.sPointX, this.sPointY, this.width, this.height, 0, 0, this.width, this.height)
                ctx.drawImage(img, this.sPointX, this.sPointY, this.width, this.height, 0, 0, this.width, this.height)
                const url = canvas.toDataURL("image/png")
                const a = document.createElement('a')
                a.href=url
                a.download = 'pic.png'
                a.click()
            }
        })
    }
    copyImage() {
        html2canvas(document.body, {
            allowTaint: true,
            foreignObjectRendering: true
        }).then( (cvs) => {
            const url = cvs.toDataURL("image/png")
            const img = document.createElement('img')
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = this.width
                canvas.height = this.height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, this.sPointX, this.sPointY, this.width, this.height, 0, 0, this.width, this.height)
                const url = canvas.toDataURL("image/png")
                const newWindow = window.open()
                newWindow.document.write(`<img src=${url}>`) 
                window.close()
            }
        })
    }


    

}
