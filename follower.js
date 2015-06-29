/**
 * Created by makhov on 23.11.14.
 */

var Follower = {

    followerKey : null,
    timeout : 5000,
    timeoutId : null,
    totalPoints : 0,
    targetPoints : 500,
    maxDataSize : 100,
    url : null,
    actions: [],
    dataSize: 0,

    // возвращает cookie с именем name, если есть, если нет, то undefined
    getCookie : function (name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    },

    setCookie : function (name, value, options) {
        options = options || {};

        var expires = options.expires;

        if (typeof expires == "number" && expires) {
            var d = new Date();
            d.setTime(d.getTime() + expires*1000);
            expires = options.expires = d;
        }
        if (expires && expires.toUTCString) {
            options.expires = expires.toUTCString();
        }

        value = encodeURIComponent(value);

        var updatedCookie = name + "=" + value;

        for(var propName in options) {
            updatedCookie += "; " + propName;
            var propValue = options[propName];
            if (propValue !== true) {
                updatedCookie += "=" + propValue;
            }
        }

        document.cookie = updatedCookie;
    },

    goActive : function () {
        this.startTimer();
    },

    goInactive : function () {
        window.Follower.actions.push({type:'goInactive',x:0,y:0,follower: this.followerKey});
        window.Follower.sendData();
    },

    startTimer : function () {
        this.timeoutId = window.setTimeout(this.goInactive, this.timeout);        
    },

    resetTimer : function (e) {
        // не можем использовать this, т.к. вызывается из window и оно же лежит в this
        window.clearTimeout(window.Follower.timeoutId);
        window.Follower.dataSize++;
        window.Follower.actions.push({type:e.type,x:e.pageX,y:e.pageY,follower: this.followerKey});
        if (window.Follower.dataSize >= window.Follower.maxDataSize) {
            window.Follower.sendData();
        }
        
        if (window.Follower.totalPoints >= window.Follower.targetPoints) {
            window.Follower.request();            
        } else {
            window.Follower.bingo(1);
            window.Follower.goActive();
        }
    },

    unload : function(e) {
        window.Follower.actions.push({type:e.type,x:e.pageX,y:e.pageY,follower: this.followerKey});
        window.Follower.sendData();
    },

    selection : function (e) {        
        var selection = window.getSelection();
        if (selection != '') {
            window.Follower.bingo(20);
        }
        window.Follower.resetTimer(e);
    },

    touchmove : function (e) {
        window.Follower.resetTimer(e);
    },

    bingo : function (points) {
        window.Follower.totalPoints += points        
        this.setCookie('FollowerPoints', window.Follower.totalPoints);        
    },

    sendData : function () {
        window.Follower.request({actions: window.Follower.actions});
        window.Follower.actions = [];
        window.Follower.dataSize = 0;
    },

    request : function (data) {
        var xmlhttp;
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp=new XMLHttpRequest();
        } else {// code for IE6, IE5
            xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.open("POST", window.Follower.url, true);
        xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xmlhttp.send('json='+window.Follower.encodeObj(data));
    },

    addEvent : function (element, evnt, funct){
        if (element.attachEvent)
            return element.attachEvent('on'+evnt, funct);
        else
            return element.addEventListener(evnt, funct, false);
    },

    encodeObj : function (obj) {
        return this.encode(JSON.stringify(obj))
    },

    encode : function (str) {
        return window.btoa(unescape(encodeURIComponent(str)))
    },

    init : function (config) {

        this.followerKey = this.getCookie('FollowerKey');
        if (typeof this.followerKey == 'undefined') {
            var followerKey = new Date().getTime();
            this.setCookie('FollowerKey', followerKey);
            this.followerKey = followerKey;
        }
        
        if (typeof config != 'undefined') {
            if (config.url) {
                this.url = config.url;
            }
            if (config.targetPoints) {
                this.targetPoints = config.targetPoints;
            }
            if (config.timeout) {
                this.timeout = config.timeout;
            }
        }

        var info = {
            browser: navigator.appVersion,
            os: navigator.platform,
            useragent: navigator.userAgent,
            display: {
                height: window.screen.availHeight,
                width: window.screen.availWidth
            },
            url: document.location.href,
            referer: document.referrer,
            follower: this.followerKey,
            lang: window.navigator.language
        };

        this.request(info);

        this.addEvent(window, 'mousemove', this.resetTimer);
        this.addEvent(window, 'mousedown', this.resetTimer);
        this.addEvent(window, 'keypress', this.resetTimer);
        this.addEvent(window, 'mousewheel', this.resetTimer);
        this.addEvent(window, 'mspointermove', this.resetTimer);

        this.addEvent(window, 'touchmove', this.touchmove);
        this.addEvent(window, 'mouseup', this.selection);

        this.addEvent(window, 'beforeunload', this.unload);

        this.startTimer();
    }
};