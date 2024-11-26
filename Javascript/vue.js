// JavaScript for the S3 Website using Vue.js

const backendUrl = "https://superschoolstore.eu-west-2.elasticbeanstalk.com"; // The back end environment URL.

let app = new Vue({
  el: "#App",
  data: {
    currentPage: "aboutUs", // currentPage sets the landing page to be presented on website interaction and allows tracking of the current page.
    lessons: [], // Procucts is inicialised empty and will attain the lessons from mongoDB database lessons collection.
    searchQuery: "", // A string for keyword searching.
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
    // Payment information gathered through the checkout page.
    payment: {
      cardNumber: "",
      expiryDate: "",
      cvv: "",
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
        const adjustedLesson = {
          ...lesson,
          spacesAvailable: lesson.spacesAvailable - lessonInCartCount,
        };
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
      return cartTotal.toFixed(2); // The total is rounded to 2 decimal places using toFixed(2).
    },

    // A computed method to check whether a user can complete checkout.
    canCheckout() {
      if (
        this.user.forename &&
        this.user.surname &&
        this.user.phoneNumber &&
        this.user.email === this.user.confirmEmail &&
        this.user.password === this.user.confirmPassword &&
        this.user.termsAccepted &&
        this.payment.cardNumber &&
        this.payment.expiryDate &&
        this.payment.cvv
      ) {
        return true; // Return true is all conditions are met.
      } else {
        return false; // Return false if one or more condition is not met.
      }
    },
  },

  methods: {
    // Below are reusable methods for API calls and event handling.

    // An async method to fetch the total number of customer purchases from the database, purchases collection.
    async fetchCustomerPurchasesAmount() {
      try {
        const response = await fetch(`${backendUrl}/collections/purchases`);
        const data = await response.json();
        this.customerPurchases = data.length;
        console.log("Fetched purchases amount:", this.customerPurchases);
      } catch (error) {
        console.error(
          "Error fetching customer purchases from the Database:",
          error
        );
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

    // An async method to fetch the filtered and sorted lessons.
    async fetchFilteredAndSortedLessons() {
      try {
        const sortAspect = this.selectedSortAspect;
        const sortOrder = this.sortOrder;
        const response = await fetch(`${backendUrl}/collections/lessons/${sortAspect}/${sortOrder}`); // Fetch using a template string with embeded expressions `${}`.
        const data = await response.json();
        this.lessons = data;
        console.log(
          "Fetched custom filtered and sorted lessons:",
          this.lessons
        );
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
            console.error(
              `Failed to ${operation} ${lessonField}: ${response.statusText}`
            );
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
        this.fetchFilteredAndSortedLessons();
      }
    },
    sortOrder() {
      if (this.sortOrder) {
        this.fetchFilteredAndSortedLessons();
      }
    },
  },

  created() {
    // Created method which is triggered after the instance is created and initialises data collection from the database.
    this.fetchLessons(); // Call fetchLessons() method when the Vue instance is created.
    this.fetchCustomerPurchasesAmount();
    setInterval(this.fetchCustomerPurchasesAmount, 60000); // Set an interval time limit of 1 minute before calling the method.
  },
});
