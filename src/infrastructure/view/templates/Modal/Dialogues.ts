class dialogues {
  about =
    'This application is currently under development by medical students Sam Chen and Andrew Goldmann under the direction of Dr. Joshua Steinberg';
  disclaimer =
    'Dear Colleague, please note carefully that these antibiograms only reflect the testing results for the year and locales noted. You have to know how to interpret the data here and you have to know how to use antibiogram information when making clinical care decisions. This app is no substitute for knowledge, training, and experience treating infections. The app is merely a quick reference for commonly used information to assist local clinicians. Remember, always do your own thinking.';
  constructor() {}
  getAboutDialogue() {
    return this.about;
  }
  getDisclaimerDialogue() {
    return this.disclaimer;
  }
}

export default dialogues;