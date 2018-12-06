module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')
  
  app.on('*', async context => {
    app.log('something happened');
    context.log(context.payload)
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
