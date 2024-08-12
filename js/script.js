const { z } = window.Zod;
var currentStep = 0;
var term = 'mo';
var currAddonsIndexs = [];
var currPlanIndex = -1;
const stepMenuItems = document.getElementsByClassName('step-item');
const stepsScreens = document.getElementsByClassName('step');
const stepsCount = stepsScreens.length
const nextStepBtns = document.getElementsByClassName('next-step')
const backStepBtns = document.getElementsByClassName('go-back');
const termSwitch = document.getElementById('switch');
const form = document.getElementById('form');

const plans = [
    {id: 'acrade', yr: 90, mo: 9},
    {id:'advanced', mo: 12, yr: 120}, 
    {id: 'pro',mo: 15, yr: 150 },
]

const addonsData = [
    {id: 'onlineService', name: 'Online Service', mo: 1, yr: 10},
    {id: 'largerStorage', name: 'Larger Storage', mo: 2, yr: 20},
    {id: 'customizableProfile', name: 'Customizable Profile', mo: 2, yr: 20},
]

function calcTotal(){
    var t =  plans[currPlanIndex][term];
    currAddonsIndexs.forEach(function(index) {
        t += addonsData[index][term];
    })
    
    return t;
}

function buildAddonItemHtml(addon) {
    const price = addonsData[addon][term];
    return `
        <div class="addons-item">
            <div class="addons-name">
                ${addonsData[addon].name}
            </div>
            <div class="addons-price">
                +$${price}/${term}
            </div>
        </div>
    `
}

function setSummeryHtml() {
    // reset view
    document.getElementsByClassName('summery-details')[0]?.remove()
    document.getElementsByClassName('summery-total')[0]?.remove()
    // create elements
    const planHtml = `
        <div class="plan">
            <div class="name">
                ${plans[currPlanIndex]['id']} (${term === 'mo' ? 'Monthly' : 'Yearly'})
                <br /><a href="#">Change</a>
            </div>
            <div class="price" id="chosenPlanPrice">
                $${plans[currPlanIndex][term]}/${term}
            </div>
        </div>
    `

    const addonsHtmlItems = currAddonsIndexs.map(addIndex => buildAddonItemHtml(addIndex)) || [];

    const total = calcTotal();
    const totalElement = document.createElement('div')
    totalElement.classList.add('summery-total');
    totalElement.innerHTML = `
        <div class="leading">Total <span>(per ${term === 'mo' ? 'month' : 'year' })</span></div>
        <div class="total-price">+$${total}/mo</div>
    `

    const summeryDetails = document.createElement('div')
    summeryDetails.classList.add('summery-details');
    summeryDetails.innerHTML = planHtml + addonsHtmlItems.join(' ');

    const summery = document.getElementById('summery')
    const buttonsWrap = document.getElementsByClassName('buttons-wrap')[3]

    summery.insertBefore(summeryDetails,buttonsWrap)
    summery.insertBefore(totalElement, buttonsWrap)


}


function addListenerToStepButtons() {
    for (var b = 0; b < nextStepBtns.length; b++) {
        nextStepBtns[b].addEventListener('click', nextStep);
    }

    for (var c = 0; c < backStepBtns.length; c++) {
        backStepBtns[c].addEventListener('click', prevStep);
    }
}

const phoneRegex = new RegExp(
    /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const personalSchema = z.object({
    name: z.string().min(4, { message: 'Too short name' }).max(50, { message: 'Too long name' }),
    email: z.string().email(),
    phone: z.string().regex(phoneRegex, 'Invalid phone number')
});

const planSchema = z.object({
    term: z.enum(['mo', 'yr']),
    plan: z.enum(['acrade', 'advanced', 'pro'], { message: 'You must choose a plan' })
});

const addonsSchema = z.object({
    addons: z.array(z.string())
})


function hideAndShowScreens() {
    for (var i = 0; i < stepsCount; i++) {
        if (i !== currentStep) {
            stepsScreens[i].classList.add('hidden');
            stepMenuItems[i].classList.remove('active')
        } else {
            stepsScreens[i].classList.remove('hidden')
            stepMenuItems[i].classList.add('active')

            if (currentStep === 3) {
                //set input data in view
            }
        }
    };
}

function setErrors(error) {
    const errors = error.flatten().fieldErrors;
    console.log('errors', errors)
    for (let key in errors) {
        const span = document.createElement('span')
        span.classList.add('error-msg');
        span.innerHTML = errors[key].join(',')
        if (key === 'plan') {
            const radioGroup = document.getElementsByClassName('radio-group')[0]
            radioGroup.prepend(span);
        } else {
            const input = document.getElementById(key)
            input.classList.add('invalid')
            const parent = input.parentNode;
            parent.append(span);
        }
    }
}

function resetErrors() {
    for (let field of ['email', 'name', 'phone']) {
        const input = document.getElementById(field);
        input.classList.remove('invalid')
    }

    const errorMessages = document.getElementsByClassName('error-msg')
    for (var i = 0; i < errorMessages.length; i++) {
        errorMessages[i].remove();
    }

}

function handleResults(result) {
    if (!result.success) {
        setErrors(result.error);
    } else {
        if(result.data.plan) {
            currPlanIndex = plans.findIndex(p => p.id === result.data.plan)
        }

        if(result.data.addons) {
            let tmp = []
            result.data.addons.forEach(function(itm) {
                const newIndex = addonsData.findIndex(function(addon) {
                    return addon.id === itm;
                });
                tmp.push(newIndex);
            })
            currAddonsIndexs = tmp;
        }
    }
    return result.success;
}

function validate() {
    resetErrors();
    const data = new FormData(form);
    var result;
    switch (currentStep) {
        case 0:
            result = personalSchema.safeParse({
                name: data.get('name'),
                email: data.get('email'),
                phone: data.get('phone')
            })
            return handleResults(result)
        case 1:
            result = planSchema.safeParse({
                plan: data.get('plan'),
                term: data.get('term') ? 'yr' : 'mo',
            })
            return handleResults(result);

        case 2:
            result = addonsSchema.safeParse({
                addons: data.getAll('addons')
            });
            return handleResults(result)
        default:
            return true;
    }
}

function nextStep() {
    if (currentStep < stepsScreens.length - 1) {
        if(currentStep <= 2) {
            const isValid = validate()
            if(isValid) { 
                currentStep++;
                hideAndShowScreens();
            }
        }
    }

    if(currentStep === 3) setSummeryHtml()
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        hideAndShowScreens()
    }
}

termSwitch.addEventListener('change', function() {
    term = this.checked ? 'yr' : 'mo';

    const planPriceSpans = document.getElementsByClassName('plan-price');
    const addonPriceSpans = document.getElementsByClassName('add-price');
    const freeSpan = document.getElementsByClassName('free-triel')

    for(var pi=0; pi< planPriceSpans.length; pi++ ){
        planPriceSpans[pi].innerHTML = `$${plans[pi][term]}/${term}`
        freeSpan[pi].classList.toggle('hidden')
        addonPriceSpans[pi].innerHTML = `$${addonsData[pi][term]}/${term}`
    }
})


form.addEventListener('submit', function (evt) {
    evt.preventDefault();

    stepsScreens[3].classList.toggle('hidden')

    document.getElementsByClassName('thanku')[0].classList.toggle('hidden')

})


addListenerToStepButtons();
hideAndShowScreens();