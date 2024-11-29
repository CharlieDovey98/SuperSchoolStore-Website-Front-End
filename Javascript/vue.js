// JavaScript for the S3 Website using Vue.js

const backendUrl = "https://superschoolstore.eu-west-2.elasticbeanstalk.com"; // The back end environment URL.
//const backendUrl = "http://127.0.0.1:3000"; // The testing environment URL.
let app = new Vue({
  el: "#App",
  data: {
    currentPage: "aboutUs", // currentPage sets the landing page to be presented on website interaction and allows tracking of the current page.
    lessons: [], // Procucts is inicialised empty and will attain the lessons from mongoDB database lessons collection.
    searchQuery: "", // A string for keyword searching through the lessons in the database.
    searchResults: [], // Results from the backend after a keyword search through the database.
    foundResults: true, // A boolean to indicate the state of the keyword search.
    selectedSortAspect: "", // Selected key for sorting (location, price, courseLength, spacesAvailable, subject).
    sortOrder: "", // Ascending, descending or no sorting order.
    cart: [], // Cart is inicialised to empty and will update when the user adds lessons to their cart or removes them.
    customerPurchases: 0, // The customerPurchases integer holds the length of the purchases collection within the database.
    user: {
      // User information gathered through the checkout page.
      forename: "",
      surname: "",
      email: "",
      confirmEmail: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
    payment: {
      // Payment information gathered through the checkout page.
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
    validations: {
      isForenameValid: true,
      isSurnameValid: true,
      isPhoneNumberValid: true,
      isEmailValid : true,
      isEmailConfirmationValid: true,
      isPasswordValid: true,
      isPasswordConfirmationValid: true,
      isCardNumberValid: true,
      isExpiryDateValid: true,
      isCvvValid: true,
  },
  },

  computed: {
    // Below are computed properties that automatically update when their dependent data changes.

    // A computed method to update the display at the top right of the website, showing the amount of items in the cart.
    itemsInTheCart: function () {
      if (this.cart.length == 0) {
        return "";
      } else if (this.cart.length == 1) {
        return `${this.cart.length} item`;
      } else {
        return `${this.cart.length} items`;
      }
    },

    // A computed method to adjust all lessons dynamically based on the cart contents.
    updatedLessons() {
      const updatedLessonsArray = [];
      for (let lesson of this.lessons) {
        // A for loop to loop through each lesson and check if its in the cart.

        let lessonInCartCount = 0;
        for (let cartItem of this.cart) {
          // A for loop through all cart items, if a match between the id's is found, update the cartCount
          if (cartItem.id === lesson.id) {
            lessonInCartCount++;
          }
        }
        // Copy the lesson using spread syntax (...lesson) and adjust spacesAvailable by matches found.
        const adjustedLesson = {...lesson, spacesAvailable: lesson.spacesAvailable - lessonInCartCount,};
        updatedLessonsArray.push(adjustedLesson); // Push back the adjustedLesson and overwrite the original lesson object.
      }
      return updatedLessonsArray;
    },

    // A computed method to total the costs of lessons in the cart to be displayed on the checkout page.
    totalCartPrice() {
      let cartTotal = 0;
      for (let lesson of this.cart) {
        cartTotal += lesson.price;
      }
      return Number(cartTotal.toFixed(2)); // The total is rounded to 2 decimal places using toFixed(2).
    },

    // A computed method to check whether a user can complete checkout.
    canCheckout() {
      if (
        this.user.forename &&
        this.user.surname &&
        this.user.phoneNumber &&
        this.validations.isForenameValid &&
        this.validations.isSurnameValid &&
        this.validations.isPhoneNumberValid
        //this.user.email === this.user.confirmEmail &&
        //this.user.password === this.user.confirmPassword &&       
        //this.user.termsAccepted &&                                // Additional verification and checks.
        //this.payment.cardNumber &&                                // These options are disabled to meet course requirements.
        //this.payment.expiryDate &&
        //this.payment.cvv
      ) {
        return true; // Return true is all conditions are met.
      } else {
        return false; // Return false if one or more condition is not met.
      }
    },

    // A computed property to determine if the keyword search is active.
    isSearchActive() {
      return this.searchQuery.trim().length > 0;
    },
  },

  methods: {
    // Below are reusable methods for API calls and event handling.

    // A method for attaining the images full url, to then display it on the website.
    getFullImageUrl(imagePath) {
      return `https://superschoolstore.eu-west-2.elasticbeanstalk.com/${imagePath}`;
    },

    // An async method to fetch the total number of customer purchases from the database, purchases collection.
    async fetchCustomerPurchasesAmount() {
      try {
        const response = await fetch(`${backendUrl}/collections/purchases`);
        const data = await response.json();
        this.customerPurchases = data.length;
        console.log("Fetched purchases amount:", this.customerPurchases);
      } catch (error) {
        console.error("Error fetching customer purchases from the Database:", error);
      }
    },

    // An async method to fetch the data from the database, lessons collection.
    async fetchLessons() {
      try {
        const response = await fetch(`${backendUrl}/collections/lessons`);
        const data = await response.json();
        this.lessons = data;
        console.log("Fetched lessons:", this.lessons);
      } catch (error) {
        console.error("Error fetching lessons from the Database:", error);
      }
    },

    // A method to trigger fetch, only when both selectedSortAspect and sortOrder are selected.
    triggerFetch() {
      if (this.selectedSortAspect && this.sortOrder) {
        this.fetchFilteredAndSortedLessons();
      }
    },

    // An async method to fetch the filtered and sorted lessons.
    async fetchFilteredAndSortedLessons() {
      try {
        const sortAspect = this.selectedSortAspect;
        const sortOrder = this.sortOrder;
        this.searchQuery = "";
        const response = await fetch(`${backendUrl}/collections/lessons/${sortAspect}/${sortOrder}`); // Fetch using a template string with embeded expressions `${}`.
        const data = await response.json();
        this.lessons = data;
        console.log("Fetched custom filtered and sorted lessons:", this.lessons);
      } catch (error) {
        console.error("Error fetching filtered and sorted lessons:", error);
      }
    },

    // Clear the keyword searching, filters and sorting options.
    resetFilters() {
      this.selectedSortAspect = "";
      this.sortOrder = "";
      this.searchQuery = "";
      this.fetchLessons();
    },

    // Debounce method to apply a timeout to the keyword searching method.
    debounce(func, wait) {
      let timeout;
      return (...args) => { // Copy the args using spread syntax (...lesson) and apply the setTimeout method.
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };  
    },

    // A debounced async keywordSearch method used to keyword search the elements of the database's Lessons collection. 
    keywordSearch: async function () {
      try {
        this.selectedSortAspect = "";
        this.sortOrder = "";
        // Guard statement to reset results if the search query is empty.
        if (!this.searchQuery.trim()) {
          this.searchResults = [];
          this.foundResults = true;
          return;
        }
        // Fetch search results from the backend.
        const response = await fetch(`${backendUrl}/search/${this.searchQuery}`);
    
        // If search has completed without error, store the search results
        const results = await response.json();
        this.searchResults = results;
        this.foundResults = results.length > 0; // Set the boolean using a length check.
    
      } catch (error) {
        console.error("Error during search:", error);
        this.searchResults = [];
        this.foundResults = false;
      }
    },

    // A method to highlight a specific query within a field using css.
    highlightText(field, query) {
      if (!query) return field; // Return original if no query
      const regex = new RegExp(`(${query})`, "gi"); // Match query case-insensitively
      return field.replace(regex, "<span class='keywordSearchQueryHighlighting'>$1</span>"); // Wrap matched query in <span> to highlight using the css styling.
    },

    // A method to add lessons from the shopping page to the users 'Cart'.
    addToCart(lesson) {
      // If there is space available, add the lesson to the cart and reduce the spaces left.
      if (lesson.spacesAvailable > 0) {
        this.cart.push(lesson);
        lesson.spacesAvailable -= 1;
        console.log(
          `${lesson.title} added to cart. Spaces remaining: ${lesson.spacesAvailable}`
        );
      } else {
      }
    },

    // A method to remove lessons from the users 'Cart'.
    removeFromCart(lessonIndex) {
      // Remove the lesson from the cart and update the spaces available.
      const lesson = this.cart[lessonIndex];
      lesson.spacesAvailable += 1;
      this.cart.splice(lessonIndex, 1);
      console.log(
        `${lesson.title} removed from cart. Spaces remaining: ${lesson.spacesAvailable}`
      );
    },

    // A method to scroll to the top of the page.
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    // A method to change the layout of the website to 'about us page'.
    showAboutUs() {
      this.currentPage = "aboutUs";
    },

    // A method to change the layout of the website to 'shopping page'.
    showShoppingPage() {
      this.currentPage = "shopping";
    },

    // A method to change the layout of the website to the 'checkout page'.
    showCheckoutPage() {
      if (this.cart.length === 0) {
        alert("Your cart is empty. Please add a lesson from the lessons page.");
        this.currentPage = "shopping"; // Navigate back to the lessons page.
      } else if (this.cart.length > 0) {
        if (this.currentPage === "checkout") {
          this.currentPage = "shopping"; // Navigate back to the lessons page if already on checkout.
        } else {
          this.currentPage = "checkout"; // Navigate to the checkout page.
        }
      }
    },

    // An async method to update a lesson field with a new value.
    async updateLessonField(lessonId, lessonField, operation, value) {
      try {
        console.log(
          `Updating lessonId: ${lessonId}, field: ${lessonField}, operation: ${operation}, value: ${value}`
        );
        const response = await fetch(`${backendUrl}/collections/lessons/${lessonId}/${lessonField}/${operation}`,{
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value }), // Send the new value for the field.
          }
        );

        if (!response.ok) {
          console.error(`Failed to ${operation} ${lessonField}: ${response.statusText}`);
          return;
        }

        const data = await response.json();
        console.log(
          `${operation} operation on ${lessonField} successful:`,
          data
        );
      } catch (error) {
        console.error("Error updating lesson field:", error);
      }
    },

    // Below are the checkout validation methods, using regular expressions.
    validateForename() {
      const regex = /^[a-zA-Z\s'-]{2,}$/; // Regex allowing lowercase, and uppercase letters, spaces, apostrophe, and hyphens, with a minimum length of 2.
      this.validations.isForenameValid = regex.test(this.user.forename); // test the users input against the regex, evaluating to true or false.
    },
    validateSurname() {
      const regex = /^[a-zA-Z\s'-]{2,}$/; // Regex allowing lowercase, and uppercase letters, spaces, apostrophe, and hyphens, with a minimum length of 2.
      this.validations.isSurnameValid = regex.test(this.user.surname);
    },
    validatePhoneNumber() {
      const regex = /^[\d\s+-]{10,14}$/; // Regex allowing digits, spaces, plus sign, and hyphens, with a length between 10-14.
      this.validations.isPhoneNumberValid = regex.test(this.user.phoneNumber);
    },
    validateEmail() {
      const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Regex allowing a valid email format e.g. name@hotmail.co.uk .
      this.validations.isEmailValid = regex.test(this.user.email);
    },
    validateEmailConfirmation() {
      this.validations.isEmailConfirmationValid = this.user.email === this.user.confirmEmail; // Confirms the email matches the first email input.
    },
    validatePassword() {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!?<>£$€%^&*#@])[A-Za-z\d!?<>£$€%^&*#@]{8,}$/; 
      // Regex allowing one lowercase letter, one uppercase letter, one digit, and one special character with a length of at least 8 characters.
      this.validations.isPasswordValid = regex.test(this.user.password);
    },
    validatePasswordConfirmation() {
      this.validations.isPasswordConfirmationValid = this.user.password === this.user.confirmPassword; // Confirms the password matches the first password input.
    },
    validateCardNumber() {
      const regex = /^[\d]{16}$/; // Regex allowing a length of exactly 16 digits.
      this.validations.isCardNumberValid = regex.test(this.payment.cardNumber);
    },
    validateCardExpiryDate() {
      const regex = /^(0[1-9]|1[0-2])\d{2}$/; // Regex allowing the MMYY format, MM is 01-12, followed by 2 digits for the year.
      this.validations.isExpiryDateValid = regex.test(this.payment.expiryDate);
    },
    validateCardCvv() {
      const regex = /^[\d]{3}$/; // Regex allowing for a length of exactly three digits.
      this.validations.isCvvValid = regex.test(this.payment.cvv);
    },

    // A method to confirm checkout and purchase lessons the user has in their cart. Confirmed with an alert.
    async submitCheckout() {
      if (this.canCheckout) {
        try {
          const lessonsPurchased = []; // Create an empty array to store the lessons purchased by the user.

          // A for loop to add lessons to the lessonsPurchased array.
          for (let i = 0; i < this.cart.length; i++) {
            const cartItem = this.cart[i];
            let found = false;

            // A for loop to check if the lesson is already in the lessonsPurchased array.
            for (let j = 0; j < lessonsPurchased.length; j++) {
              if (lessonsPurchased[j].id === cartItem.id) {
                lessonsPurchased[j].spacesPurchased += 1; // Increment the amount of spaces purchased if the lesson is already in the lessonsPurchased array.
                found = true;
                break;
              }
            }

            // If the lesson is not in the lessonsPurchased array, add it.
            if (!found) {
              lessonsPurchased.push({
                lessonId: cartItem.id,
                spacesPurchased: 1,
              });
            }
          }

          // Prepare the purchase object, containing the user information and their lessons purchased, with the spaces purchased for each lesson.
          const purchaseObject = {
            id: this.customerPurchases + 1,
            forename: this.user.forename,
            surname: this.user.surname,
            phoneNumber: this.user.phoneNumber,
            email: this.user.email,
            purchaseTotal: this.totalCartPrice,
            cardNumber: this.payment.cardNumber,
            expiryDate: this.payment.expiryDate,
            cvv: this.payment.cvv,
            lessons: lessonsPurchased,
          };

          // fetch request to add the created purchase to the purchases collection.
          const response = await fetch(`${backendUrl}/collections/purchases`, {
            method: "POST", // Set the method header as POST.
            headers: { "Content-Type": "application/json" }, // Set the data type to JSON data.
            body: JSON.stringify(purchaseObject), // Stringify the body purchaseObject data.
          });

          // Guard statement to check the response success allowing for further code to be executed or not.
          if (!response.ok) {
            console.error(`Failed to ${operation} ${lessonField}: ${response.statusText}`);
            return;
          }

          const responseData = await response.json();
          console.log("Purchase response:", responseData);

          alert("Purchase complete, Thank you for shopping with S3!");

          // Update the lessons in the database for each purchased lesson.
          for (let lesson of lessonsPurchased) {
            await this.updateLessonField(
              lesson.lessonId,
              "spacesAvailable",
              "decrement",
              lesson.spacesPurchased
            );
          }

          // Fetch lessons from the database to update local data.
          await this.fetchLessons();

          this.customerPurchases += 1; // Increment the local customerPurchases count to reflect the completed purchase.

          // Clear user checkout form inputs and cart.
          this.user = {
            forename: "",
            surname: "",
            email: "",
            confirmEmail: "",
            phoneNumber: "",
            password: "",
            confirmPassword: "",
            termsAccepted: false,
          };
          this.payment = {
            cardNumber: "",
            expiryDate: "",
            cvv: "",
          };
          this.cart = [];
        } catch (error) {
          console.error("Error during checkout:", error);
          alert(
            "There was an error processing your checkout. Please try again."
          );
        }
      } else {
        alert(
          "Please fill out all required fields correctly and accept the Terms and Conditions."
        );
      }
    },
  },

  watch: {
    // Watch methods react to changes in specific data properties and triggers logic or updates.

    // Watch for changes in selectedSortAspect or sortOrder to fetch updated lessons.
    selectedSortAspect() {
      if (this.selectedSortAspect) {
        this.triggerFetch();
      }
    },
    sortOrder() {
      if (this.sortOrder) {
        this.triggerFetch();
      }
    },
  },

  created() {
    // Created method which is triggered after the instance is created and initialises data collection from the database.
    this.fetchLessons(); // Call fetchLessons() method when the Vue instance is created.
    this.fetchCustomerPurchasesAmount();
    setInterval(this.fetchCustomerPurchasesAmount, 60000); // Set an interval time limit of 1 minute before calling the method.
    this.debouncedKeywordSearch = this.debounce(this.keywordSearch, 500); // Convert keywordSearch() method into a debounced method with a timer set to 500ms.
  },
});
