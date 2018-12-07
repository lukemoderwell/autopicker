const Git = require('nodegit')
const Rimraf = require('rimraf')
const Axios = require('axios')
const path = require("path")

const repoURL = process.env.REPO_URL
const targetLabel = "hotfix"
var commitHashes = [];

// the github bit
module.exports = app => {
  app.log('autopicker 🍒  started')

  // clone fresh repo from github
  createLocalRepo().then(function () {
    app.log(`cloned repo from ${repoURL}`)
  }).catch(function (err) {
    app.log(err)
  });

  // listen for someone to give the right label name
  app.on(['pull_request.labeled', 'pull_request.unlabeled'], async context => {
    var pr = context.payload.pull_request;
    var labels = pr.labels;
    var commitsURL = pr.commits_url
    for (key in labels) {
      if (labels[key].name == targetLabel) {
        // do our stuff here
        // first get the commit hashes
        Axios.get(commitsURL).then(function (res) {
          var commits = res.data;
          for (key in commits) {
            commitHashes.push(commits[key].sha);
          }
        }).then(function () {
          Git.Repository.open(path.resolve('./tmp')).then(function(repo) {
            return repo.getCommit(commitHashes[0]);
          }).then(function(commit) {
            app.log(commit);
          }).catch(function(err) {app.log(err)})
        }).catch(function(err) {app.log(err)});
      }
    }
  });

  function createLocalRepo() {
    return new Promise(function (resolve, reject) {
      // remove old repo
      Rimraf('./tmp', function () {
        app.log('removed stale repo');
        // setup a cloned repo locally
        const localPath = path.join(__dirname, "tmp");
        var cloneOptions = {};
        cloneOptions.fetchOpts = {
          callbacks: {
            certificateCheck: function () {
              return 1;
            }
          }
        };
        var cloneRepository = Git.Clone(repoURL, localPath, cloneOptions);
        resolve(cloneRepository)
        var errorAndAttemptOpen = function () {
          return Git.Repository.open(path.resolve(__dirname, "tmp"));
        };
        cloneRepository.catch(errorAndAttemptOpen).then(function (repo) {
          // Access any repository methods here.
          app.log("Is the repository bare? %s", Boolean(repo.isBare()));
        });
      });
    })
  }
}
