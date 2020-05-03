import {generateReadme} from './index';
(async function execute(){
  try{
    await generateReadme();
  }catch(e){
    console.log(e.message);
  }
})();
