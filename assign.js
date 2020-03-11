'use strict';

// Style Guide: https://github.com/airbnb/javascript
// TODO Track pool. maybe by dates...? by month..?

// ==== OUT OF POOL REMINDERS ====
// Before running:
// Will, M. Hurd, and CK Kim temporarily out of pool
// Took out timmy for Feb 2020
// ===============================

// TODO:
//     - Date handler function? Keep track of when brothers are gone
//       and don't assign them anything

(function main() {
    // handleReplace(10, []);
    // return;

    const year = 2020;
    const month = 2; // 0 to 11
    const prevMonth = month - 1;
    console.log('Reading for month of ' + getMonthFromInt(prevMonth));
    const qualifications = getQualificationsJson(prevMonth);

    const fullPool = qualifications.pool;
    let pool = [...fullPool];
    const attendant = qualifications.attendant;
    const sound = qualifications.sound;
    const soundTraining = qualifications.soundTraining;
    const stage = qualifications.stage;
    const mic = qualifications.mic;
    const media= qualifications.media;

    const schedule = populateSchedule(year, month, pool, attendant, sound, soundTraining, stage, mic, media);
    const json = scheduleToJson(schedule);
    writeScheduleToFile(json, getMonthFromInt(month));
    // const json = scheduleToJson(month, fullPool, schedule);
    // const fileName = 'testFileJson';
    // writeJsonToFile(json, fileName);

    

    // console.log('Replace someone!');
    // replacePerson(pool, mic, micSlots, 'guy6');
    // replacePerson(pool, sound, soundSlot, 'guy3');
    // toString(attendantSlots, soundSlot, soundTrainingSlot, stageSlot, micSlots, mediaSlot);
    const newQualifications = qualificationsToJson(pool, attendant, sound, soundTraining, stage, mic, media);
    writeQualificationsToFile(newQualifications, getMonthFromInt(month));
}());

function populateSchedule(year, month, pool, attendant, sound, soundTraining, stage, mic, media) {
    let attendantSlots = [null, null];
    let soundSlot = [null];
    let soundTrainingSlot = [null];
    let stageSlot = [null];
    let micSlots = [null, null];
    let mediaSlot = [null];
    
    // Create copy; do not modify original pool.
    let tempPool1 = [...pool];
    
    let finalJson = {};
    finalJson.month = getMonthFromInt(month);
    // Get all meeting days (Wednesdays and Sundays)
    const allMonthDaysArray = getAllDays(year, month);
    // First assign media downloader to the whole month
    addPersons(tempPool1, media, mediaSlot, false);
    finalJson.media = mediaSlot[0];
    
    // Split into two and assign important roles: attendant and sound
    addPersons(tempPool1, attendant, attendantSlots);
    addPersons(tempPool1, sound, soundSlot);
    if (soundTraining.length !== 0)
        addSoundTraining(tempPool1, sound, soundTraining, soundTrainingSlot);
    else // if no one to train sound, then just pull it from sound pool
        addPersons(tempPool1, sound, soundTrainingSlot);
    addPersons(tempPool1, stage, stageSlot);
    // Assign Mic for each day, where mic is put back one time to double-up.
    finalJson.days = {};
    allMonthDaysArray.forEach((element, index) => {
        // When halfway mark of month is reached, do a rotation and assign new parts
        if (index === parseInt(allMonthDaysArray.length / 2)) {
            attendantSlots = [null, null];
            soundSlot = [null];
            soundTrainingSlot = [null];
            stageSlot = [null];
            tempPool1 = [...pool];
            // Add attendants, sound, sound training, and stage
            addPersons(tempPool1, attendant, attendantSlots);
            addPersons(tempPool1, sound, soundSlot);
            addPersons(tempPool1, sound, soundTrainingSlot);
            addPersons(tempPool1, stage, stageSlot);
        }
        let micSlots = [null, null];
        let tempPool2 = [...tempPool1];
        addMic(tempPool2, mic, micSlots);
        let day = getMonthFromInt(month) + ' ' + element; 
        finalJson.days[day] = addDay(attendantSlots, soundSlot, soundTrainingSlot, stageSlot, micSlots);
    });
    
    return finalJson;
}

function addDay(attendantSlots, soundSlot, soundTrainingSlot, stageSlot, micSlots) {
    const result = {
        outsideAttendant: attendantSlots[0],
        insideAttendant: attendantSlots[1],
        sound: soundSlot[0],
        soundTraining: soundTrainingSlot[0],
        stage: stageSlot[0],
        mic: micSlots
    };
    return result;
}

// JSON Related functions ============================================================================

function getJson(fileName, filePath) {
    if (!fileName.includes('.json')) 
        fileName += '.json';
    const fs = require('fs');
    const dict = fs.readFileSync(filePath + '/' + fileName);
    return JSON.parse(dict);
}


function getCongJson(congName) {
    const filePath = 'configs/';
    const fileName = congName + 'Config.json';
    
    return getJson(fileName, filePath);
}

function getQualificationsJson(month) {
    if (typeof month !== 'number') {
        throw new Error('Month var must be int.');
    }
    const filePath = 'qualifications/';
    const fileName = 'qualifications' + getMonthFromInt(month);
    
    return getJson(fileName, filePath);
}

function getScheduleJson(month) {
    const filePath = 'schedules/';
    const fileName = month + 'SoundSchedule.json';

    return getJson(fileName, filePath);
}

function qualificationsToJson(pool, attendant, sound, soundTraining, stage, mic, media) {
    let result = {
        pool: pool,
        attendant: attendant,
        sound: sound,
        soundTraining: soundTraining,
        stage: stage,
        mic: mic,
        media: media
    };
    return JSON.stringify(result);
}

function scheduleToJson(schedule) {
    return JSON.stringify(schedule);
}

function writeJsonToFile(json, fileName, filePath) {
    //console.log(JSON.stringify(json, null, 4))
    if (!fileName.includes('.json')) 
        fileName += '.json';
    const fs = require('fs');
    fs.writeFile(filePath + '/' + fileName, json, 'utf8', function(err) {
        if (err) return console.log(err);
        console.log('File ' + fileName + ' saved successfully.');
    });
}

function writeQualificationsToFile(json, month) {
    const filePath = 'qualifications/';
    const fileName = 'qualifications' + month + '.json';
    writeJsonToFile(json, fileName, filePath);
}

function writeScheduleToFile(json, month) {
    const filePath = 'schedules/';
    const fileName = month + 'SoundSchedule.json';
    writeJsonToFile(json, fileName, filePath);
}

function writeCongToFile(json, congregation) {
    const filePath = 'configs/';
    const fileName = congregation + 'Config.json';
    writeJsonToFile(json, fileName, filePath);
}

// Congregation related function =================================================

function createCongConfig(congName, weekendMeetingDay, weekdayMeetingDay, publisherCount='') {
    json = getCongJson('baseConfig');
    json.congregation.name = congName;
    json.congregation.weekendMeetingDay = weekendMeetingDay;
    json.congregation.weekdayMeetingDay = weekdayMeetingDay;
    json.publishers.count = publisherCount;

    writeCongToFile(json, congName);
}

function updateCongConfig(congName, weekendMeetingDay, weekdayMeetingDay, publisherCount='') {
    fileName = congName + 'Congregation';
    json = getCongJson(fileName);

    json.congregation.name = congName;
    json.congregation.weekendMeetingDay = weekendMeetingDay;
    json.congregation.weekdayMeetingDay = weekdayMeetingDay;
    json.publishers.count = publisherCount;
}

//================================================================================

function addSoundTraining(pool, sound, soundTraining, soundTrainingSlot) {
    /**
     * This method pulls from soundTraining and then will move the person
     * to the start of sound.
     * Then a sound person will be moved to sound Training
     */
    for (let i = 0; i < soundTrainingSlot.length; i++) {
        for (let j = 0; j < soundTraining.length; j++) {
            // Check used for replacePerson
            if (soundTrainingSlot[i] !== null)
                continue;
            soundTrainingSlot[i] = soundTraining[j];
            // Move experienced sound to start of soundTraining
            // for (let k = 0; k < sound.length; k++) {
            //     let element = sound[k];
            //     if (pool.includes(element)) {
            //         soundTraining.unshift(element);
            //         sound.splice(k, 1);
            //         break;
            //     }
            // }
            // Move soundtraining to sound.
            sound.unshift(soundTraining.splice(j, 1)[0]);
            
            // Remove from Pool
            let poolIndex = pool.indexOf(soundTrainingSlot[i]);
            if (poolIndex > -1) {
                pool.splice(poolIndex, 1);
            }
            break;
        }
    }
}

function addMic(pool, micList, micSlots) {
    /**
     * Separate from addPersons because each person should do it twice
     * before rotating. This function will simply add the second user back
     * into the pool to be used a second time.
     */
    for (let i = 0; i < micSlots.length; i++) {
        for (let j = 0; j < micList.length; j++) {
            // Check used for replacePerson
            if (micSlots[i] = null)
                continue;
            if (pool.includes(micList[j])) {
                micSlots[i] = micList[j];

                if (i ===0) {
                    let randomIndex = micList.length - Math.floor(Math.random() * parseInt(micList.length / 3));
                    micList.splice(randomIndex, 0, micList.splice(j, 1)[0]);
                }
                // Remove from Pool
                let poolIndex = pool.indexOf(micSlots[i]);
                if (poolIndex > -1) {
                    pool.splice(poolIndex, 1);
                }
                break;
            }
        }
    }
}

function addPersons(pool, personList, slots, poolCheck = true) {
    /**
     * Use this for all except soundTraining.
     * poolCheck used for media downloader, 
     * where pool does not change after
     */
    // iterate through, start at 0
    for (let i = 0; i < slots.length; i++) {
        for (let j = 0; j < personList.length; j++) {
            // Check used for replacePerson
            if (slots[i] !== null)
                continue;
            if (!poolCheck) {
                console.log(slots[i]);
                slots[i] = personList[j];
                personList.push(personList.splice(j, 1)[0]);
                break;
            } else if (pool.includes(personList[j])) {
                slots[i] = personList[j];
                let randomIndex = personList.length - Math.floor(Math.random() * parseInt(personList.length / 2));
                personList.splice(randomIndex, 0, personList.splice(j, 1)[0]);
    
                // Remove from Pool
                let poolIndex = pool.indexOf(slots[i]);
                if (poolIndex > -1) {
                    pool.splice(poolIndex, 1);
                }
                break;
            }
        }
    }
}

//==============Replace functions ====================================

function handleReplace(month, arr) {
    // arr [(days, position, name), (...)]
    //getMonthFromInt(month) // use this if month it is returned as an index ...Eg. 0 to 11
    const month = 'Nov';
    let position = 'mic';
    let name = 'J. Yee';
    let days = ['Nov 27'];
    //days = ['Nov 17', 'Nov 20', 'Nov 24', 'Nov 27'];

    // Get jsons
    const qualificationsJson = getQualificationsJson(month);
    const scheduleJson = getScheduleJson(month);

    replacePerson(qualificationsJson, scheduleJson, days, position, name);
    // for (let tuple of arr) {

    // }

}


function replacePerson(qualificationsJson, scheduleJson, days, position, name) {
    // WEB: Click a name, press replace, refresh json list
    // if clicked on mic, return one day
    // if clicked on any other, return multiple days
    // if media...just replace the media
    
    // console.log(scheduleJson.days);
    console.log(qualificationsJson);
    console.log('\n\n');

    if (position === 'media') {
        replaceMedia(qualificationsJson, scheduleJson, name);
    } else {
        if (position === 'mic') {
            let pool = adjustPool(qualificationsJson, scheduleJson, days[0]);
            replaceMic(qualificationsJson, scheduleJson, days, pool, name)
        } else {
            if (position === 'soundTraining') {

            } else { // Attendant, stage

            }

            for (const day of days) {

            }
        }
        // for (const day of days) {
        //     let pool = adjustPool(qualificationsJson, scheduleJson, day);
        //     // Move person back to the front of the queue
        //     if (position=== 'soundTraining') {
                
        //     } else if (position=== 'mic') {
        //         replaceMic(qualificationsJson, scheduleJson, pool, person)
        //     } else { // Attendant, sound, stage
                
        //     }
        // }
    }
        // Find person
        //console.log(scheduleJson);
        //console.log(scheduleJson.days);
        // Replace person from scheduleJson
        // If person is attendant, replace for 2 weeks.
        // If person is sound, replace for the 2 weeks and put back into sound
        // If person is assistant in soundTraining, replace for the 2 weeks and 2 weeks after. 
        //     - If qualified then just replace with sound
        // If person is mic, just replace for the day
        // Update json of the month. Eg update november
    // console.log(scheduleJson.days);
    console.log(qualificationsJson);
    console.log('\n\n');
}
    
function adjustPool (qualificationsJson, scheduleJson, day) {
    // Adjust the pool in order to be used with replacing someone
    // Do not use with media duty
    let pool = [...qualificationsJson.pool];
    const dayJson = scheduleJson.days[day];

    // Remove from Pool
    let poolIndex = pool.indexOf(dayJson.outsideAttendant);
    if (poolIndex > -1) pool.splice(poolIndex, 1);
    poolIndex = pool.indexOf(dayJson.insideAttendant);
    if (poolIndex > -1) pool.splice(poolIndex, 1);
    poolIndex = pool.indexOf(dayJson.sound);
    if (poolIndex > -1) pool.splice(poolIndex, 1);
    poolIndex = pool.indexOf(dayJson.soundTraining);
    if (poolIndex > -1) pool.splice(poolIndex, 1);
    poolIndex = pool.indexOf(dayJson.stage);
    if (poolIndex > -1) pool.splice(poolIndex, 1);
    for (let m of dayJson.mic) {
        poolIndex = pool.indexOf(m);
        if (poolIndex > -1) pool.splice(poolIndex, 1);
    }
    return pool;
}

function replacePerson2(pool, personList, slots, person) {
    // NOT TO BE USED with mic or sound and soundTraining slots
    // Designed to only replace one at a time
    // Take out person from slot
    let slotIndex = slots.indexOf(person);
    slots[slotIndex] = null;

    // Replace person with someone else on personList
    addPersons(pool, personList, slots);

    // Move personList position from the end to [0]
    let personListIndex = personList.indexOf(person);
    personList.splice(personListIndex, 1);
    personList.unshift(person);
}

function replaceMedia(qualificationsJson, scheduleJson, person) {
    // Directly replace the Json files
    const pool = qualificationsJson.pool;
    let mediaList = qualificationsJson.media;
    // Replace person with someone else on the personList that
    // is not the same person.
    let temp = [null];
    addPersons(pool, mediaList, temp, false);
    scheduleJson.media = temp[0];
    // Move the user from (usually) the back to the front
    let index = qualificationsJson.media.indexOf(person);
    qualificationsJson.media.splice(index, 1);
    qualificationsJson.media.unshift(person);
}

function replaceMic(qualificationsJson, scheduleJson, days, pool, person) {
    // Use this instead of replacePerson() because
    // mics are back-to-back. Just replace and put them
    // at the end
    if (days.length > 1) {
        throw new Error('replaceMic(): days array should not be > 1 in length.');
    }

    // Directly replace the Json files
    let micList = qualificationsJson.mic;
    let micSlots = scheduleJson.days[days[0]].mic;
    let slotIndex = micSlots.indexOf(person);
    micSlots[slotIndex] = null;

    // Replace person with someone else on the personList that
    // is not the same person.
    addPersons(pool, micList, micSlots);

    // Do not move them back to the front.
}

function replaceSound(qualificationsJson, scheduleJson, days, pool, person) {
    // Use this instead of replacePerson() because
    // Qualified sound is replaced back into sound.
    // Unqualified sound (soundTraining) is moved back
    // into soundTraining, and not sound.

    // Supposedly, sound training should always appear in the first 2 weeks
    // first 2 weeks: 
    //   - sound assistant: replace from sound
    //   - main sound: replace from soundTraining
    // last 2 weeks:
    //   - sound assistant: just replace from someone from sound
    //   - main sound: just move them into sound (they SHOULD havej ust been trained), replace with sound
    let slotIndex = slot.indexOf(person);
    slot[slotIndex] = null;

    if (!qualified) { // Has not been trained for sound.
        // Replace someone with next soundTraining
        let listIndex = list.indexOf(person);
        
        soundTraining
        // Move person to back into soundTraining.

    } else { // Has been trained for sound
        // Replace the assistant with someone from sound.
        addPersons(pool, sound, slot);

        // Move to start of sound
        let listIndex = list.indexOf(person);
        list.splice(listIndex, 1);
        list.unshift(person);
    }
    // Move from sound to soundTraining
    // 2 conditions
    // 1. Replace sound training in beginning of month, real trainny
    //    - need to replace... those 2 weeks and sound of next 2 weeks
    //    - move them to first of soundtraining
    //    - need to remove them from next sound training...
    // 2. Replace sound training of one who is already qualified...
    //    - just replace them and move them back into sound assistant?
    //    - move them to first slot of sound

}

function replaceOther() {
    // If qualified brothers arr length=== 0
    // consider extracting from mics...
    // start from the start of the list of the
    // qualificaitons matched against the pool.
    // Then replace sound. If no results, manually do it.
}

// Remove functions ===========================================================

function removePerson() {
    // Simply remove from the duties.
    // Should only be used when removing someone
    // from sound that has not been trained.
}

// Getters for handling day logic ============================================

function getAllDays(year, month) {
    const allMonthdays = daysInMonth(year, month);
    const firstMonthDay = getFirstWedOrSun(year, month);
    const day = new Date(year, month, firstMonthDay).getDay();

    const daysArray = getAllWedSun(firstMonthDay, allMonthdays, day);
    return daysArray;
}

function daysInMonth(year, month) {
    // Starts from 1
    return new Date(year, month + 1, 0).getDate();
}

function getFirstWedOrSun(year, month) {
    for (let i = 1; i <= 7; i++) {
        if (isWedOrSun(year, month, i))
            return i;
    }
}

function isWedOrSun(year, month, day) {
    // getDay() returns 0 to 6
    // 0 = Sunday; 3 = wednesday;
    const d = new Date(year, month, day);
    if (d.getDay() === 0 || d.getDay() === 3)
        return true;
    return false;
}

function isMeetingDay(year, month, day) {
    // get it from config?
    getCongJson()
    weekend = 0;
    weekday = 2;
    if (d.getDay() === 0 || d.getDay() === 3)
        return true;
    return false;
}

/**
 * Gets all Wednesday and Sundays of the month.
 * This function is specific for Cupertino Cong, because
 * their meeting days are on Wed and Sun.
 * Use the other method getAllMeetingDays() if not Wed and Sun. 
 */
function getAllWedSun(firstDay, daysInMonth, day) {
    let result = [];
    let span = 0;
    let span2 = 0;

    // Get the span between the two days
    if (day === 0)
        span = 3;
    else if (day === 3)
        span = 4;
    else
        return console.error('Not Sun or Wed');
    span2 = 7 - span;

    let counter = firstDay;
    result.push(counter);
    while (counter <= daysInMonth) {
        counter += span;
        if (counter > daysInMonth)
            break;
        result.push(counter);
        counter += span2;
        if (counter > daysInMonth)
            break;
        result.push(counter);
    }
    return result;
}

/**
 * Returns an array with all meeting days in it.
 * Args:
 *      firstDay: first day of the month
 *      daysInMonth: Number of days in the month
 *      day: Is the first meeting day Wed or Sun?
 */
function getAllMeetingDays(firstDay, daysInMonth, day) {
    let result = [];
    let span = 0;
    let span2 = 0;
    // Read in a config file...?
    // Get the span between the meeting days
    if (day === 0) // Sun
        span = 3;
    else if (day === 3) // Wed
        span = 4;
    else
        throw new Error('getAllMeetingDays() - Invalid Input: Not Wed or Sun')
    span2 = 7 - span;

    let counter = firstDay;
    result.push(counter);
    while (counter <= daysInMonth) {
        counter += span;
        if (counter > daysInMonth)
            break;
        result.push(counter);
        counter += span2;
        if (counter > days)
            break;
        result.push(counter);
    }
    return result;
}

/**
 * ! Not used so far !
 * Returns the number corresponding to the 
 * Args:
 *      day: String
 * Return:
 *      Integer: 0 - 6
 */
function getDayAsInt(day) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const daysAbrv = ['sun', 'mon', 'tues', 'wed', 'thurs', 'fri', 'sat']

    const d = day.toLowerCase();
    if (days.includes(d)) 
        return days.indexOf(d)
    else if (daysAbrv.includes(d))
        return daysAbrv.indexOf(d)
    else
        throw new Error('getDayAsInt() - InvalidInput: Did not input valid day.')
}

/**
 * Input:
 *      Month: Integer 0 to 11
 * Return:
 *      String representation of integer
 */
function getMonthFromInt(month) {
    if (month === -1) month = 11;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 
                        'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    return monthNames[month];
}

function toString(attendantSlots, soundSlot, soundTrainingSlot, stageSlot, micSlots, mediaSlot) {
    console.log('Sound Schedule:');
    console.log('Outside Attendant: ' + attendantSlots[0] + ' Inside Attendant: ' + attendantSlots[1]);
    console.log('Sound: ' + soundSlot + ' Sound Assistant: ' + soundTrainingSlot);
    console.log('Stage: ' + stageSlot[0]);
    console.log('Mics: ' + micSlots[0] + ' ' + micSlots[1]);
    console.log('Media Downloader: ' + mediaSlot[0]);
}

class Congregation {

    constructor(configName) {
        this.congName = '';
        this.weekendMeetingDay = '';
        this.weekdayMeetingDay = '';
    }
}