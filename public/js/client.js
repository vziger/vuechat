if ("WebSocket" in window) {
  const DEFAULT_NAME = 'няшный пупсик'
  const TIME_LIMIT = 200
  const param = window.location.search.toString()
  const name = (param.indexOf('=') > 0) ? param.split('=')[1].replace('+', '') : DEFAULT_NAME
  const ssocket = new WebSocket(`ws://pm.tada.team/ws?name=${name}`)

Vue.component('chat-message', {
  props: ['message', 'myName'],
  template: `
    <div class="message"
      :class="{'admin': message.name === 'ADMIN',
              'owner': message.name === myName}">
        <div class="message-content z-depth-1">
        <template v-if="message.name !== 'ADMIN'"> 
          <div class="message-name">
            {{message.name}}
          </div>
        </template>
        <div><pre>{{message.text}}</pre></div>
      </div>
    </div>`
})

new Vue({
  el: '#app',
  data: {
    message: '',
    messages: [],
    users:[],
    stopspam: '',
    lastMessageTime: null
  },
  methods: {
    sendMessage() {
      // 1. Маленькая проверка на спам — есть скрытое поле stopspam с типом 'email' для ботов. 
      // если оно вдруг заполнено, то сообщения в чат отправляться не будут
      // 2. Проверка на скорость отправки сообщений — таймаут 200мс
      if (this.stopspam === '') {
        if(this.lastMessageTime !== null) {
          const delta = Date.now() - this.lastMessageTime
          if(delta > TIME_LIMIT) {
            ssocket.send(JSON.stringify({"text": this.message}))
            this.lastMessageTime = Date.now()
            this.message = ''
          } else {
            M.toast({html: `Хэй, ты всё так быстро делаешь, детка?!`,
                    displayLength: 3000, classes: 'rounded'})
            console.log(`Хэй, ты всё так быстро делаешь, детка?!`)
          }
        } else {
          ssocket.send(JSON.stringify({"text": this.message}))
          this.lastMessageTime = Date.now()
          this.message = ''
        }
      }
    },
    clickNick(user) {
      this.message = `${user}: `
      this.$refs.input_ref.focus()
    },
    deleteUser(name) {
      if (this.users.lastIndexOf(name) !== -1) {
        this.users = this.users.filter(u => u !== name)
      }
    },
    initializeConnection() {
      this.$refs.input_ref.focus()
      ssocket.onmessage = event => {
        if(event) {
          const message = JSON.parse(event.data)
          this.updateUserList(message)
          this.messages.push(message)
        }
        scrollToBottom(this.$refs.messages_window)  
      }
      scrollToBottom(this.$refs.messages_window)

      ssocket.onclose = event => {
        console.log(`Event code: ${event.code}`)
        console.log(`Event reason: ${event.reason}`)
        console.log(`Event wasClean: ${event.wasClean}`)
        let reasonTmp
        if (event.code == 1000)
            reasonTmp = 'Normal closure, meaning that the purpose for which the connection was established has been fulfilled.'
        else if(event.code == 1001)
            reasonTmp = 'An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.'
        else if(event.code == 1002)
            reasonTmp = 'An endpoint is terminating the connection due to a protocol error'
        else if(event.code == 1003)
            reasonTmp = 'An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).'
        else if(event.code == 1004)
            reasonTmp = 'Reserved. The specific meaning might be defined in the future.'
        else if(event.code == 1005)
            reasonTmp = 'No status code was actually present.'
        else if(event.code == 1006)
           reasonTmp = 'The connection was closed abnormally, e.g., without sending or receiving a Close control frame'
        else if(event.code == 1007)
            reasonTmp = 'An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).'
        else if(event.code == 1008)
            reasonTmp = 'An endpoint is terminating the connection because it has received a message that \'violates its policy\'. This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.'
        else if(event.code == 1009)
           reasonTmp = 'An endpoint is terminating the connection because it has received a message that is too big for it to process.'
        else if(event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
            reasonTmp = `An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. Specifically, the extensions that are needed are: ${event.reason}`
        else if(event.code == 1011)
            reasonTmp = 'A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.';
        else if(event.code == 1015)
            reasonTmp = `The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).`
        else
            reasonTmp = 'Unknown reason'
        console.log(`My reason: ${reasonTmp}`)
      }

      ssocket.onerror = error => {
        console.log(`Error: ${error.data}`)
      }
    },
    upFirstLetter(str) {
      if (!str) return str
      return str[0].toUpperCase() + str.slice(1)
    },
    updateUserList(message) {
      if (typeof message.name === 'undefined'){
        // по имени АДМИН в темплейте добавляю класс css для его сообщений
        message.name = 'ADMIN'

        // так как нет api, чтобы запросить список активных флудильщиков, 
        // по сообщениям админа "пришёл/ушёл" обновляю список юзеров
        let user = message.text.split(':')[1].trim()
        if (this.users.lastIndexOf(user) === -1) {
          this.users.push(user)
        }
        if (message.text.split(':')[0].trim() === 'ушёл') {
          this.deleteUser(user)
        }
        message.text = this.upFirstLetter(message.text).replace(':','')
      } else {
        // добавил проверку сообщений и по ним тоже обновляю список юзеров 
        // например — Козьма всегда в чате и только по наличию его сообщений можно 
        // добавить его в список
        if (this.users.lastIndexOf(message.name) === -1) {
          this.users.push(message.name)
        }
      }
    }
  },
  computed: {
    myName() {
      const param = window.location.search.toString()
      const str = (param.indexOf('=') > 0) ? param.split('=')[1].replace('+', '') : DEFAULT_NAME
      return decodeURIComponent(str)
    }
  },
  mounted() {
    this.initializeConnection()
  }
})

function scrollToBottom(node) {
  setTimeout(() => {
    node.scrollTop = node.scrollHeight
  })
}

} else{
  alert('WebSocket не поддерживается вашим браузером');
}