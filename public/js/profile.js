document.addEventListener('DOMContentLoaded',()=>{
    const btn = document.querySelector('.edit_profile_btn a'),
        editContainer = document.querySelector('.wrapper'),
        closeBtn = document.querySelector('.close');

    btn.addEventListener('click',(event)=>{
        event.preventDefault();
        if (editContainer){
            editContainer.classList.add('show-container');
        }
        else{
            console.log('Error rule')
        }
    });
    closeBtn.addEventListener('click',(event)=>{
        // event.preventDefault();
        if (editContainer){
            editContainer.classList.remove('show-container');
        }
        else{
            console.log('Error rule')
        }
    });
    // editContainer.addEventListener('click',(event)=>{
    //     // event.preventDefault();
    //     if (editContainer){
    //         editContainer.classList.remove('show-container');
    //     }
    //     else{
    //         console.log('Error rule')
    //     }
    // });
});