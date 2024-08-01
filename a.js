var __api = {
  _ajax: async function (url, method, body) {
    const params = {
      method: method,
      headers: { "Content-Type": "application/json;charset=UTF-8" },
    };
    if (body) {
      params.body = body;
    }
    const response = await Promise.race([
      fetch(url, params),
      new Promise(function (resolve, reject) {
        setTimeout(() => {
          reject(new Error("Timeout !"));
        }, 5 * 1000);
      }),
    ]);
    return response.json();
  },

  get: async function (url) {
    return await this._ajax(url, "GET");
  },

  put: async function (url, body) {
    return await this._ajax(url, "PUT", body);
  },

  post: async function (url, body) {
    return await this._ajax(url, "POST", body);
  },
};

var __gitee_access_token = "";

var __gitee = {
  owner: "NieShuBao",
  repo: "sync-01",
  path: "github-database.txt",

  now: function () {
    return new Date().toLocaleString();
  },

  post: async function () {
    await __api.post(
      `https://gitee.com/api/v5/repos/${this.owner}/${this.repo}/contents/${this.path}`,
      JSON.stringify({
        //
        access_token: __gitee_access_token,
        content: btoa("init"),
        message: "insert-" + this.now(),
      })
    );
  },

  _get: async function () {
    return await __api.get(`https://gitee.com/api/v5/repos/${this.owner}/${this.repo}/contents/${this.path}?access_token=${__gitee_access_token}`);
  },

  get: async function () {
    const res = await this._get();
    if (res.length == 0) {
      await this.post();
      return await this._get();
    }
    return res;
  },

  put: async function (content) {
    const res = await this.get();
    await __api.put(
      `https://gitee.com/api/v5/repos/${this.owner}/${this.repo}/contents/${this.path}`,
      JSON.stringify({
        //
        access_token: __gitee_access_token,
        content: btoa(encodeURIComponent(content)),
        message: "update-" + this.now(),
        sha: res.sha,
      })
    );
  },
};

var __msg = {
  vFlg: 0,
  vTmr: null,
  vMsg: null,
  vAlt: null,

  _show: function (v) {
    if (v) {
      this.vMsg.show();
      if (this.vTmr != null) clearInterval(this.vTmr);
      this.vTmr = setTimeout(() => {
        this._show(0);
      }, 3000);
    } else this.vMsg.hide();
  },
  show: function (text, color) {
    if (this.vFlg) {
      //
      this.vMsg.css({ background: color });
      this.vAlt.html(text);
      this._show(1);
      return;
    }
    this.vFlg = true;
    //
    $("body").append(`
        <div id="msg" style="display:none;position:fixed;top:8px;width:200px;margin-left:-100px;left:50%;text-align:center;border-radius:4px;color:#fff;">
            <span id="alt"></span>
        </div>
        `);
    this.vMsg = $("#msg");
    this.vAlt = $("#alt");
    //
    this.vMsg.css({ background: color });
    this.vAlt.html(text);
    this._show(1);
  },
  showSuccess: function (text) {
    this.show(text, "#67c23a");
  },
  showError: function (text) {
    this.show(text, "#f56c6c");
  },
};

async function init() {
  const res = await __gitee.get();
  if (res.message) {
    __msg.showError(res.message);

    $("#my_submit").attr("disabled", "disabled");
  } else {
    const data = decodeURIComponent(atob(res.content));
    $("#my_textarea").val(data);
    $("#my_submit").removeAttr("disabled");
  }
}

$(function () {
  let text = $("#my_textarea");
  let iptToken = $("#access_token");

  var tk = window.localStorage.getItem("token");
  if (tk != null) {
    __gitee_access_token = tk;
    iptToken.val(tk);
    init();
  }

  $("#my_set").click(function () {
    let tmp = iptToken.val();
    __gitee_access_token = tmp;
    window.localStorage.setItem("token", tmp);
  });

  $("#my_submit").click(function () {
    __gitee.put(text.val());
  });
});
