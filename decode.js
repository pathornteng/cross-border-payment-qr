#!/usr/bin/env node
const argv = require("minimist")(process.argv.slice(2), { string: "_" });
const qr = String(argv._[0]).replace(/-/g, "");

PPText2Obj = {
  PP_APP_ID_USER: "A000000677010111",
  PP_APP_ID_MERCHANT: "A000000677010112",
  QR_TYPE: {
    11: "Never expire QR-Code",
    12: "One-time QR-Code",
  },
  ACCOUNT_TYPE: {
    "01": "Telephone Number",
    "02": "Thai ID Card",
    "03": "e-Wallet ID",
  },

  _decode: function (pp_text) {
    var pp_obj = {};
    var field_no = "";
    var field_size = "";
    for (var i = 0; i < pp_text.length; i++) {
      // get field no
      if (!field_no) {
        field_no = pp_text.substr(i, 2);
        // console.log(i, field_no, field_size);
        i += 1;
      }
      // get field size
      else if (!field_size) {
        field_size = parseInt(pp_text.substr(i, 2));
        // console.log(i, field_no, field_size);
        i += 1;
      }
      // get field value
      else {
        pp_obj[field_no] = pp_text.substr(i, field_size);
        // console.log(i, field_no, field_size, pp_obj[field_no]);
        // shift to next field
        i += field_size - 1;
        field_no = "";
        field_size = "";
      }
    }
    return pp_obj;
  },

  decode: function (pp_text) {
    var obj = this._decode(pp_text);

    // user: extract more field 29
    var merchant_info = obj["29"] || null;
    if (merchant_info != null) {
      var merchant_obj = this._decode(merchant_info);
      if (merchant_obj["00"] != this.PP_APP_ID_USER) {
        return null;
      }
      for (var k in merchant_obj) {
        if (k != "00") {
          obj["29_acc_type"] = k;
          obj["29_acc_no"] = Number(merchant_obj[k]).toString();
        }
      }
    }

    // merchant: extract more field 30
    var merchant_info = obj["30"] || null;
    if (merchant_info != null) {
      var merchant_obj = this._decode(merchant_info);
      if (merchant_obj["00"] == this.PP_APP_ID_MERCHANT) {
        for (var k in merchant_obj) {
          if (k == "01") {
            obj["30_biller_id"] = merchant_obj[k];
          } else if (k == "02") {
            obj["30_merchant_id"] = merchant_obj[k];
          } else if (k == "03") {
            obj["30_txn_id"] = merchant_obj[k];
          }
        }
      }
      obj["30_obj"] = merchant_obj;
    }

    // merchant: extract more field 31
    var merchant_info = obj["31"] || null;
    if (merchant_info != null) {
      var merchant_obj = this._decode(merchant_info);
      for (var k in merchant_obj) {
        if (k == "02") {
          obj["31_merchant_id"] = merchant_obj[k];
        } else if (k == "04") {
          obj["31_txn_id"] = merchant_obj[k];
        }
      }
      obj["31_obj"] = merchant_obj;
    }

    // merchant: extract more field 62
    var merchant_info = obj["62"] || null;
    if (merchant_info != null) {
      var merchant_obj = this._decode(merchant_info);
      for (var k in merchant_obj) {
        if (k == "07") {
          obj["62_ref_3"] = merchant_obj[k];
        }
      }
      obj["62_obj"] = merchant_obj;
    }

    return obj;
  },
};

function decodeQR(content) {
  var obj = PPText2Obj.decode(content);
  if (obj) {
    return {
      ID: obj["29_acc_no"],
      Amount: obj["54"],
      Country: obj["58"],
    };
  } else {
    console.error("Invalid format\n" + "\n" + content);
  }
}

var tx = decodeQR(qr);
console.log(tx);
