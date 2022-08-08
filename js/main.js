// deprecated
function getNickname(ip) {
    try {
        return __config["ip_map"][ip];
    } catch (e) {
        return undefined;
    }
}

function parseString(str) {
    if (typeof str !== "string")
        return false;

    var flag = false;
    var mappedTokens = new Array(), unmappedTokens = new Array(), buf;
    var unmappedToken, mappedToken;

    var from = 0, isBracket = false, substr;
    while (true) {
        index = str.indexOf("`", from);
        if (isBracket) {
            if (index === -1) {
                throw new Error("Parse error");
            } else {
                buf.push(str.substring(from, index));
            }
            
            if (str.charAt(index + 1) === "`") {
                buf.push("`");
                from = index + 2;
            }
            else {
                isBracket = false;
                unmappedToken = buf.join("");
                mappedToken = getNickname(unmappedToken);
                mappedTokens.push(mappedToken ? mappedToken : unmappedToken), unmappedTokens.push(unmappedToken);
                delete buf;
                from = index + 1;
            }
        }
        else {
            if (index === -1) {
                substr = str.substring(from);
                mappedTokens.push(substr), unmappedTokens.push(substr);
                break;
            } else {
                substr = str.substring(from, index);
                mappedTokens.push(substr), unmappedTokens.push(substr);
            }
            
            flag = true;
            if (str.charAt(index + 1) === "`") {
                mappedTokens.push("`"), unmappedTokens.push("`");
                from = index + 2;
            }
            else {
                isBracket = true;
                buf = new Array();
                from = index + 1;
            }
        }
    }
    if (isBracket) {
        throw new Error("Parse error");
    }

    if (flag) {
        mappedTokens = mappedTokens.join(""), unmappedTokens = unmappedTokens.join("");
        if (mappedTokens !== unmappedTokens)
            return {
                mapped: mappedTokens,
                unmapped: unmappedTokens
            };
        else
            return {
                unmapped: unmappedTokens
            }
    } // 문자열에 ` 시퀀스 없거나 문자열이 아니면 false
    else
        return false;
}

function objcat(dst, src) {
    if (src === undefined || src === null)
        return dst;
    else if (typeof src === "object") {
        if (dst === undefined || dst === null)
            dst = Array.isArray(src) ? [] : {};
        else if (typeof dst === "object") {
            if (Array.isArray(dst) && !Array.isArray(src))
                dst = {};
            else if (!Array.isArray(dst) && Array.isArray(src))
                dst = [];
        } else
            dst = Array.isArray(src) ? [] : {};
        for (var key in src)
            dst[key] = objcat(dst[key], src[key]);
        return dst;
    } else
        return src;
}

function getTime() {
    var d = new Date(),
        digit2 = function (num) {
            return (num < 10) ? "0" + num : num;
        };
    return d.getFullYear() + "." +
        (d.getMonth() + 1) + "." +
        d.getDate() + " " +
        digit2(d.getHours()) + ":" + digit2(d.getMinutes()) + ":" + digit2(d.getSeconds());
}

function getNullPromise() {
    return new Promise(resolve => {
        resolve();
    });
}

function readJSON(path) {
    return new Promise((resolve, reject) => {
        if (path === undefined || path === null)
            reject();
        else {
            $.getJSON(path, json => {
                resolve(json);
            }).fail(() => {
                __toast.push({
                    event: "add",
                    type: "read_fail",
                    body: {
                        time: getTime(),
                        state: "caution",
                        title: "데이터를 로드하는 데 이상이 있습니다.",
                        description: path + " 경로에 올바른 파일이 존재하는지 확인하십시오."
                    }
                });
                reject();
            });
        }
    });
}
function writeJSON({ path, content, success, writeError, serverError }) {
    $.ajax(_getAjaxParameter({
        url: "write",
        body: {
            path: path,
            content: content,
        },
        success: success,
        writeError: writeError,
        serverError: serverError
    })).done(() => {}).fail(() => {});
}
function _getAjaxParameter({ url, body, success, writeError, serverError }) {
    return {
        url: url,
        contentType: "application/json",
        method: "POST",
        crossDomain: true,
        data: JSON.stringify(body),
        success: (data, textStatus, jqXHR) => {
            if (data = parseInt(data)) { // 0(성공) or 1(오류) : string으로 data 넘어옴. "0"은 true로 캐스팅되므로 주의
                if (writeError)
                    writeError();
                else
                    __toast.push({
                        event: "add",
                        type: "write_error",
                        body: {
                            time: getTime(),
                            state: "caution",
                            title: "데이터를 불러올 수 없습니다.",
                            description: body.path + " 경로가 액세스 가능한지 확인하십시오."
                        }
                    });
            }
            else {
                if (success)
                    success();
                else
                    /*__toast.push({
                        event: "add",
                        type: "write_success",
                        body: {
                            time: getTime(),
                            title: "데이터를 성공적으로 저장했습니다.",
                            description: body.path
                        }
                    })*/;
            }
            //console.log(data);
        },
        error: (jqXHR, textStatus, errorThrown) => {
            if (serverError)
                serverError();
            else
                __toast.push({
                    event: "add",
                    type: "server_error",
                    body: {
                        time: getTime(),
                        state: "caution",
                        title: "서버가 응답하지 않습니다.",
                        description: "서버가 실행 중인지 확인하십시오."
                    }
                });
            // console.log(textStatus);
        }
    };
}

function getRandomInt(max, min) {
    const DEFAULT_MAX = 1000;
    if (!min)
        min = 0;
    if (!max)
        max = DEFAULT_MAX;
    return Math.floor(Math.random() * (max - min)) + min;
}

function parseIndex(index, length) {
    if (index < -length)
        index = 0;
    else if (index < 0)
        index += length;
    else if (index > length)
        index = length;
    return index;
}

function isObject(o) {  // 빈 객체도 검사
    if (typeof o !== "object" || o == undefined || o == null)
        return false;
    if (Array.isArray(o))
        return false;
    var flag = false;
    for (var key in o) {
        flag = true;
        break;
    }
    return flag;
}

// add, replace, flush (<- replaceAll)
class Toast {
    constructor(id) {
        this.id = id;
        this.jsonPath = null;
        this.length = 0;

        var $id = $(id).addClass("toast-container");
        $id.attr({
            "aria-live": "polite",
            "aria-atomic": true
        });
        $id.css("visibility", "hidden");
    }

    // for external message
    reload() {
        if (!this.jsonPath)
            return new Promise(resolve => {
                resolve();
            });
        return this.load(this.jsonPath);
    }
    load(jsonPath) {
        this.jsonPath = jsonPath;

        var _this = this;
        return new Promise(resolve => {
            readJSON(jsonPath).then(json => {
                // filter
                var hash = {};
                for (var i = 0; i < json.length; i++) {
                    switch (json[i].event) {
                        case "replace":
                            for (var j = 0; j < i; j++)
                                if (json[j].type === json[i].type)
                                    hash[j] = true;
                            break;
                        case "flush":
                            for (var j = 0; j < i; j++)
                                hash[j] = true;
                            if (!isObject(json[i].body))
                                hash[i] = true;
                            break;
                    }
                }
                var arr = [];
                for (var i = 0; i < json.length; i++)
                    if (!hash[i])
                        arr.push(json[i]);

                // export
                _this.export(arr);

                // draw
                var $externalToasts = $(".toast-external");
                for (var i = 0; i < $externalToasts.length; i++)
                    this.pop($externalToasts.eq(i), false);
                var $toast;
                for (var i = 0; i < arr.length; i++) {
                    $toast = _this._push({
                        type: arr[i].type,
                        body: arr[i].body
                    });
                    $toast.addClass("toast-external").attr("external-index", i);
                }
                resolve();
            }).catch();
        });
    }
    export (data) {
        writeJSON({
            path: this.jsonPath,
            content: data
        });
    }

    // for internal message
    push({ event, type, body }) {
        var $id = $(this.id);
        var $toasts;
        switch (event) {
            case "replace":
                $toasts = $id.find(".toast-type-" + type);
                for (var i = 0; i < $toasts.length; i++)
                    this.pop($toasts.eq(i), false);
                break;
            case "flush":
                $toasts = $id.find(".toast");
                for (var i = 0; i < $toasts.length; i++)
                    this.pop($toasts.eq(i), false);
                break;
        }   

        this._push({
            type: type,
            body: body
        });
    }
    _push({ type, body }) {
        if (!isObject(body))
            return;

        var code;
        code = "<div class=\"toast\"></div>";
        var $toast = $(code).appendTo(this.id);

        // type
        if (type)
            $toast.addClass("toast-type-" + type);

        // state
        if (body.state && body.state !== "default")
            $toast.addClass("toast-state-" + body.state);

        // time, description
        if (!body.time)
            body.time = "";
        if (!body.description)
            body.description = "";

        code = "<div class=\"toast-body\">" +
            "<div>" +
            "<p class=\"toast-time\">" + body.time + "</p>" +
            "<p class=\"toast-title\">" + body.title + "</p>" +
            "<p class=\"toast-description\">" + body.description + "</p>" +
            "</div>" +
            "<button class=\"toast-close btn-icon icon-close\"></button>" +
            "</div>";
        $toast.append(code);
        $toast.attr({
            "role": "alert",
            "aria-live": "assertive",
            "aria-atomic": true,
            "data-autohide": false
        });

        $toast.find(".toast-close").on("click", e => {
            this.pop($toast, true);
        });

        $toast.toast("show");
        if (++this.length !== 0)
            $(this.id).css("visibility", "visible");

        var div = document.querySelector(this.id);
        div.scrollTop = div.scrollHeight;

        return $toast;
    }

    pop($toast, canWriteExternal) {
        if ($toast.hasClass("hide"))
            return;

        if (canWriteExternal && $toast.hasClass("toast-external"))
            readJSON(this.jsonPath).then(json => {
                json.splice(parseInt($toast.attr("external-index")), 1);
                this.export(json);
            });
        $toast.toast("hide");
        this.length--;

        var _this = this;
        window.setTimeout(() => {
            $toast.remove();
            if (_this.length === 0)
                $(_this.id).css("visibility", "hidden");
        }, 1000);
    }
}

class Update {
    constructor({
        statusBarId,
        refreshBtnId,
        toast,
        toastPath
    }) {
        this.statusBarId = statusBarId, this.refreshBtnId = refreshBtnId;
        this.toast = toast;
        this._periodicEvent = null;
        this.pending = false;

        var code;
        // status bar setup
        if (statusBarId) {
            code = "<p></p>";
            $(statusBarId).append(code);
        }
        // refresh button setup
        if (refreshBtnId) {
            var $refreshBtnId = $(refreshBtnId);
            $refreshBtnId.addClass("float-btn-white");
            code = "<img class='icon' style='opacity: 0;' src='resrc/icons/refresh-purple.svg'>" +
                "<div class='spinner' style='opacity: 0;' role='status'><span class='sr-only'></span></div>";
            $refreshBtnId.append(code);

            var _this = this;
            $refreshBtnId.on("click", e => {
                if (!_this.pending) {
                    _this.toast.push({
                        event: "flush"
                    });
                    return _this.refresh().then(() => {
                        _this.toast.push({
                            event: "add",
                            type: "refresh",
                            body: {
                                time: getTime(),
                                title: "데이터를 새로고침했습니다."
                            }
                        });
                        return this;
                    });
                } else
                    return false;
            });
        }
        // push center setup
        if (toastPath)
            toast.load(toastPath);
    }

    // event는 promise 객체 반환하는 함수
    initially(event) {
        var _this = this;

        $(this.statusBarId).find("p").css("opacity", 0);
        _this._disableRefreshBtn(true);
        return event().then(() => {
            _this._disableRefreshBtn(false);
            _this._updateStatus();
            $("[data-toggle='tooltip']").tooltip();
            return this;
        });
    }
    periodically(event, minutes) {
        this._periodicEvent = event;

        minutes = parseInt(minutes);
        if (minutes === undefined || minutes === null || minutes <= 0)
            throw new Error();

        var _this = this;
        window.setInterval(() => {
            return _this.refresh().then(() => {
                _this.toast.push({
                    event: "replace",
                    type: "refresh",
                    body: {
                        time: getTime(),
                        title: "데이터가 자동으로 갱신되었습니다."
                    }
                });
                return this;
            });
        }, minutes * 1000);
    }
    refresh() {
        var _this = this;

        _this._disableRefreshBtn(true);
        $(this.statusBarId).find("p").css("opacity", 0);
        return _this._periodicEvent().then(() => {
            _this._disableRefreshBtn(false);
            _this._updateStatus();
            $("[data-toggle='tooltip']").tooltip();
            return _this.toast.reload();
        });
    }

    _disableRefreshBtn(isSet) {
        var $refreshIcon = $(this.refreshBtnId + " .icon"),
            $refreshSpinner = $(this.refreshBtnId + " .spinner");
        if (isSet) {
            this.pending = true;
            $refreshIcon.css("opacity", 0);
            $refreshSpinner.addClass("spinner-border").css("opacity", 1);
        } else {
            this.pending = false;
            $refreshIcon.css("opacity", 1);
            $refreshSpinner.removeClass("spinner-border").css("opacity", 0);
        }
    }
    _updateStatus() {
        var text = "최근 업데이트 : " + getTime();
        $(this.statusBarId).find("p").text(text);
        $(this.statusBarId).find("p").css("opacity", 1);
    }
}