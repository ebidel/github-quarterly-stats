// Copyright 2014 Google Inc. All Rights Reserved.

/**
 * Adds a button to a user's Github landing page to fetch their commits, prs,
 * and issue contributions for quaters.
 * @author ebidel@gmail.com (Eric Bidelman)
 */

(function() {
var NUM_QUARTERS_BACK = 4; // number of quarters back to fetch data for.

var CONTRIBS_CONTAINER = document.querySelector('#contributions-calendar');
if (!CONTRIBS_CONTAINER) {
  return
}

var CONTAINER = CONTRIBS_CONTAINER.querySelector('.contrib-details');

var USERNAME = document.querySelector('meta[property="profile:username"]');
if (USERNAME) {
  USERNAME = USERNAME.content;
} else {
  USERNAME = document.location.pathname.split('/')[1];
}

var numQuartersAgo = 1;

function addCommas(nStr) {
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

function GithubMetrics(username, opt_numQuartersAgo) {
  this.username = username;
  this.total = {commits: 0, prs: 0, issues: 0};
  this.numQuartersAgo = opt_numQuartersAgo || 1;

  this.startOfLastQuarter = moment().subtract(
      'quarter', this.numQuartersAgo).startOf('quarter');
  this.endOfLastQuarter = moment(this.startOfLastQuarter).endOf('quarter');

}

GithubMetrics.prototype.origin = 'https://github.com';

GithubMetrics.prototype.fetchDateRangeMetrics = function(from, to, callback) {
  
  var url = this.origin + '/' + this.username + '?tab=contributions&from=' +
            from.format('YYYY-MM-DD') + '&to=' + to.format('YYYY-MM-DD');

  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'document';
  xhr.onload = function(e) {
    var d = e.target.response;
    var contributions = d.querySelector('#contribution-activity-listing');

    var commits = contributions.querySelector('.octicon-git-commit');
    if (commits) {
      commits = commits.nextElementSibling.textContent;
    } else {
      commits = 0;
    }

    var issues = contributions.querySelector('.octicon-issue-opened')
    if (issues) {
      issues = issues.nextElementSibling.textContent;
    } else {
      issues = 0;
    }

    var prs = contributions.querySelector('.octicon-git-pull-request')
    if (prs) {
      prs = prs.nextElementSibling.textContent;
    } else {
      prs = 0;
    }

    callback(parseInt(commits), parseInt(prs), parseInt(issues));
  };
  xhr.send();
}

GithubMetrics.prototype.fetchQuarterMetrics = function(opt_from, opt_to) {
  var from = opt_from || null;
  var to = opt_to || null;

  if (!from || !to) {
    from = this.startOfLastQuarter;
    to = moment(from).add('month', 1);
  }

  this.fetchDateRangeMetrics(from, to, function(commits, prs, issues) {
    this.total.commits += commits;
    this.total.prs += prs;
    this.total.issues += issues;

    from = moment(to).add('day', 1);
    to = moment(from).add('month', 1);

    if (to > this.endOfLastQuarter) {
      to = this.endOfLastQuarter;
    }

    if (from < this.endOfLastQuarter) {
      this.fetchQuarterMetrics(from, to);
    } else {
      //var CONTAINER = document.querySelector('#contributions-calendar .contrib-details');
      
      var start = this.startOfLastQuarter.format('MMM DD YYYY');
      var end = this.endOfLastQuarter.format('MMM DD YYYY');

      var commitsHTML = '<div class="table-column">' +
                        '<span class="lbl">Quarter contributions</span>' +
                        '<span class="num">' + addCommas(this.total.commits) + ' commits</span>' + 
                         start + ' - ' + end + 
                        '</div>';
      var prsHTML = '<div class="table-column">' +
                      '<span class="lbl">Quarter contributions</span>' +
                      '<span class="num">' + addCommas(this.total.prs) + ' pull requests</span>' + 
                       start + ' - ' + end + 
                    '</div>';
      var issuesHTML = '<div class="table-column">' +
                         '<span class="lbl">Quarter contributions</span>' +
                         '<span class="num">' + addCommas(this.total.issues) + ' issues reported</span>' + 
                         start + ' - ' + end + 
                       '</div>';
      var html = '<div class="contrib-details">' +
                   commitsHTML + prsHTML + issuesHTML +
                 '</div>';
      CONTAINER.insertAdjacentHTML('beforeend', html);
      console.log(this.total);
    }

  }.bind(this)); 
}

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.action == 'fetchQuarterMetrics') {
    for (var i = 1; i <= NUM_QUARTERS_BACK; ++i) {
      (new GithubMetrics(USERNAME, i)).fetchQuarterMetrics();
    }
  }
});

// Inject 'Add previous quarter' button.
var a = document.createElement('a');
a.classList.add('minibutton', 'tabnav-widget');
a.textContent = 'Add previous quarter';
a.style.textAlign = 'center';
a.style.padding = '5px';
a.style.margin = '5px';
a.onclick = function(e) {
  e.preventDefault();
  //postMessage({type: 'FROM_PAGE', action: 'fetchQuarterMetrics'}, '*');
  (new GithubMetrics(USERNAME, numQuartersAgo++)).fetchQuarterMetrics();
};

CONTRIBS_CONTAINER.insertBefore(a, CONTAINER);


// Listen for messages from the extension code.
// window.addEventListener('message', function(e) {
//   // Only accept messages from ourselves
//   if (e.source != window) {
//     return;
//   }

//   console.log(e.data.action)

//   if (e.data.type && e.data.type == 'FROM_PAGE') {
//     //var port = chrome.runtime.connect();
//     //port.postMessage(e.data.text);
//   }
// }, false);

})();

