// global variables
let textField = document.querySelector('.text');
let sendButton = document.querySelector('.send');

function randomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

console.log(randomString(285));

setInterval(() => {
  textField.disabled = false;
  textField.removeAttribute('disabled');
  textField.removeAttribute('style');
  textField.value = randomString(285);
  sendButton.disabled = false;
  sendButton.removeAttribute('disabled');
  sendButton.click();
}, 300);