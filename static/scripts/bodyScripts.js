"use strict";

document.onscroll = function() {
    const headerHeight = document.getElementById("top-navbar").clientHeight;
    if (document.getElementById("search-results").scrollTop >= headerHeight) {
        console.log(this.scrollTop)
        this.classList.add("hidden");
    }    
};