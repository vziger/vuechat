### Запуск
1. открыть public/index.html
2. ввести ник
3. нажать «Go flooding»

### Предположения
1. Так как нет API по получению с сервера списка пользователей, не делал проверку, что могут одновременно прийти сколько угодно одинаковых ников
2. Предполагаю, что на сервере стоит setInterval с bufferedAmount и сообщения приходят некими маленькими пачками и не грузят канал. Размер отправляемых сообщений не проверял.
3. Сделал список юзеров по системным сообщениям «пришёл/ушёл» и по сообщениям активных пользователей (если для них нет «пришёл/ушёл»)
4. Сделал мини-проверку на спам со скрытым полем типа «email»
5. Сделал проверку на скорость отправки сообщений — таймаут 200мс
6. Все ошибки и ответы от сервера логируются в консоль
7. Если нажать на ник в списке пользователей, то он добавится в инпут для сообщения
