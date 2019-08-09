$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");

  const $navSubmit = $("#nav-submit");
  const $submitForm = $("#submit-form");
  const $navFavorites = $("#nav-favorites");
  const $favoritedArticles = $("#favorited-articles");
  const $navMyStories = $("#nav-mystories")

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $submitForm.on("submit", async function(evt) {
    evt.preventDefault();

    const title = $("#title").val();
    const url = $("#url").val();
    const hostName = getHostName(url);
    const username = currentUser.username;
    const author = $("#author").val();

    const storyObject = await storyList.addStory(currentUser, {
      title,
      author,
      url,
      username
    });

    const $li = $(`
      <li id="${storyObject.storyId}" class="id-${storyObject.storyId}">
        <span class="star">
        <i class="far fa-star"></i>
        </span>
        <a class="article-link" href="${url}" target="a_blank">
          <strong>${title}</strong>
        </a>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-author">by ${author}</small>
        <small class="article-username">posted by ${username}</small>
      </li>`);

    $allStoriesList.prepend($li);
    $submitForm.hide();
    // $submitForm.trigger("reset");
  });

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   *
   *
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  function generateFaves() {
    $favoritedArticles.empty();

    if (currentUser.favorites.length === 0) {
      $favoritedArticles.append("<h1>No favorities added! </h1>");
    } else {
      for (let story of currentUser.favorites) {
        let favoriteHTML = generateFavHTML(story);
        $favoritedArticles.append(favoriteHTML);
      }
    }
  }

  function generateMyStories() {
    $ownStories.empty();

    if (currentUser.ownStories.length === 0) {
      $ownStories.append("<h1>No Stories added! </h1>");
    } else {
      for (let story of currentUser.ownStories) {
        let ownStoriesHTML = generateOwnHTML(story);
        $ownStories.append(ownStoriesHTML);
      }
    }
  }



  function generateFavHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
        <li id="${story.storyId}">
        <span class="star">
          <i class="fas fa-star"></i>
          </span>
          <a class="article-link" href="${story.url}" target="a_blank">
            <strong>${story.title}</strong>
          </a>
          <small class="article-author">by ${story.author}</small>
          <small class="article-hostname ${hostName}">(${hostName})</small>
          <small class="article-username">posted by ${story.username}</small>
        </li>
      `);
    return storyMarkup;
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <span class="star">
        <i class="far fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    return storyMarkup;
  }

  function generateOwnHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <span class="trash">
        <i class="fa fa-trash"></i>
        </span>
         <span class="star">
        <i class="far fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    return storyMarkup;
  }


  $(".articles-container").on("click", ".trash", async function(evt) {
    if (currentUser) {
      const $evttarget = $(evt.target);
      const storyId = $evttarget.closest("li").attr("id");

      if ($evttarget.hasClass("fa-trash")) {
        await currentUser.removeOwn(storyId);
        
      } 


      // $(".trash")
      //   .parent()
      //   .hide()
        
          // $(".star")
    //   .children()
    //   .not(".fas")
    //   .parent()
    //   .parent()
    //   .hide();
    }
  });

  $navSubmit.on("click", function() {
    if (currentUser) {
      hideElements();
      $allStoriesList.show();
      $submitForm.slideToggle();
    }
  });

  // $(".star").on("click", ".fas, .far", function(e) {
  //   $(e.target).toggleClass("fas far");

  // });

  $(".articles-container").on("click", ".star", async function(evt) {
    if (currentUser) {
      const $evttarget = $(evt.target);
      const storyId = $evttarget.closest("li").attr("id");

      if ($evttarget.hasClass("fas")) {
        await currentUser.removeFavorite(storyId);
        $evttarget.closest("i").toggleClass("fas far");
      } else {
        // console.log("what is happening?")
        await currentUser.addFavorite(storyId);
        $evttarget.closest("i").toggleClass("fas far");
      }
    }
  });

  $navFavorites.on("click", function() {
    if (currentUser) {
      hideElements();
      generateFaves();
      $favoritedArticles.show();
    }
    // $(".star")
    //   .children()
    //   .not(".fas")
    //   .parent()
    //   .parent()
    //   .hide();
  });

  $navMyStories.on("click", function(){
   
    if(currentUser){
      hideElements();
      generateMyStories();
      $ownStories.show();
    }

  })

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $favoritedArticles,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
