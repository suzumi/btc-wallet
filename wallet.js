// ウォレット初回起動時の処理
const init = () => {
  const tbtc = {network: bitcoin.JS.networks.testnet}
  const key = bitcoin.JS.ECPair.makeRandom(tbtc)
  const privateKey = key.toWIF() //これが秘密鍵
  localStorage.setItem('wif', privateKey);
}

// アドレス取得
const getAddr = (key) => {
  return key.getAddress();
}

// 残高管理
const balance = (address) => {
  const ep = `https://testnet-api.smartbit.com.au/v1/blockchain/address/${address}?tx=0`;
  $.ajax({
      url: ep,
      type:'GET'
  })
  .done((data) => {
      const balance = data.address.total.balance;
      $('#balance').html(balance)
  })
  .fail( (err) => {
      console.log(err);
  });
};

const sendTx = (txb) => {
  const ep = `https://testnet-api.smartbit.com.au/v1/blockchain/pushtx`;
  $.ajax({
    url: ep,
    type:'POST',
    data: JSON.stringify({'hex': txb.build().toHex()})
  })
  .done((data) => {
      console.log('send successful');
  })
  .fail( (err) => {
      console.error(err);
  });
};

// トランザクションの生成
const createTx = (address, targetAddr, amount, fee, key) => {
  var totalBalance = 0;
  const ep = `https://testnet-api.smartbit.com.au/v1/blockchain/address/${address}/unspent?limit=1000`;
  $.ajax({
    url: ep,
    type:'GET'
  })
  .done((data) => {

      const utxoList = data.unspent;

      // const tbtc = {network: bitcoin.JS.networks.testnet};
      const txb = new bitcoin.JS.TransactionBuilder(bitcoin.JS.networks.testnet);
      console.log(utxoList);

      for(const [idx, utxo] of utxoList.entries()) {
        txb.addInput(utxo.txid, utxo.n);
        totalBalance = totalBalance + utxo.value_int;
      }
      console.log('inputの合計', totalBalance);
      var change = totalBalance - amount;
      change -= fee; // 送金分＋手数料を引いた残りをお釣りにする
      txb.addOutput(targetAddr, amount);
      txb.addOutput(address, change); //自分のアドレスにお釣り
      for(var idx=0; idx < utxoList.length; idx++) {
        txb.sign(idx, key);
      }

      sendTx(txb);

  })
  .fail( (err) => {
      console.log(err);
  });
};


const main = () => {
  if (!localStorage['wif']) {
    init();
  }

  const WIF = localStorage.getItem('wif');
  const key = bitcoin.JS.ECPair.fromWIF(WIF, bitcoin.JS.networks.testnet);
  const walletAddr = getAddr(key);
  $('#addr').html(walletAddr)

  balance(walletAddr);

  $('#sendBtn').on('click', () => {
    const targetAddr = $('#s_addr').val();
    const amount = parseInt($('#s_amount').val(), 10);
    const fee = parseInt($('#s_fee').val(), 10);
    createTx(walletAddr, targetAddr, amount, fee, key);
  });
};

main();
