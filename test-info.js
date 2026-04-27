// Test Information Database - معلومات التحاليل
const testInformation = {
    // معلومات عامة للتحاليل حسب النوع
    defaultInfo: {
        "تحليل كيميائي": {
            preparation: "صيام 8-12 ساعة",
            duration: "نفس اليوم",
            notes: "يُنصح بأخذ العينة في الصباح"
        },
        "تحليل هرموني": {
            preparation: "لا يتطلب صيام",
            duration: "2-3 أيام",
            notes: "يُفضل أخذ العينة في أوقات محددة"
        },
        "تحليل مناعي": {
            preparation: "لا يتطلب صيام",
            duration: "3-5 أيام",
            notes: "للكشف عن الأجسام المضادة"
        },
        "تحليل ميكروبيولوجي": {
            preparation: "حسب نوع العينة",
            duration: "24-72 ساعة",
            notes: "يجب أخذ العينة بطريقة صحيحة"
        },
        "واسم سرطاني": {
            preparation: "لا يتطلب صيام",
            duration: "3-5 أيام",
            notes: "للمتابعة والفحص الدوري"
        },
        "تحليل بول": {
            preparation: "عينة البول الأولى في الصباح",
            duration: "نفس اليوم - يومين",
            notes: "استخدام وعاء معقم"
        },
        "تحليل براز": {
            preparation: "عينة طازجة",
            duration: "1-3 أيام",
            notes: "تسليم العينة خلال ساعتين"
        },
        "تحليل جيني/PCR": {
            preparation: "لا يتطلب صيام",
            duration: "5-10 أيام",
            notes: "دقة عالية في الكشف"
        }
    },

    // معلومات مخصصة لبعض التحاليل المهمة
    specificTests: {
        "GLY": {
            type: "تحليل كيميائي",
            description: "قياس مستوى السكر في الدم",
            preparation: "صيام 8-12 ساعة",
            duration: "نفس اليوم",
            normalRange: "0.70 - 1.10 غ/ل",
            notes: "مهم لتشخيص مرض السكري"
        },
        "HBA1C": {
            type: "تحليل كيميائي",
            description: "قياس متوسط السكر لآخر 3 أشهر",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "< 5.7%",
            notes: "لمتابعة مرضى السكري"
        },
        "FNS": {
            type: "تحليل دموي",
            description: "تعداد كامل لخلايا الدم",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "يختلف حسب العمر والجنس",
            notes: "يكشف عن فقر الدم والعدوى"
        },
        "TSH": {
            type: "تحليل هرموني",
            description: "هرمون الغدة الدرقية",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "0.5 - 5.0 mUI/L",
            notes: "لفحص وظائف الغدة الدرقية"
        },
        "ECBU": {
            type: "تحليل ميكروبيولوجي",
            description: "فحص البول للكشف عن العدوى",
            preparation: "عينة البول الأولى في الصباح",
            duration: "24 ساعة إذا سلبي / 3 أيام إذا إيجابي",
            normalRange: "لا توجد جراثيم",
            notes: "يجب غسل اليدين قبل أخذ العينة"
        },
        "CREA": {
            type: "تحليل كيميائي",
            description: "قياس وظائف الكلى",
            preparation: "صيام 8 ساعات",
            duration: "نفس اليوم",
            normalRange: "7-13 ملغ/ل",
            notes: "مؤشر على صحة الكلى"
        },
        "UREE": {
            type: "تحليل كيميائي",
            description: "قياس اليوريا في الدم",
            preparation: "صيام 8 ساعات",
            duration: "نفس اليوم",
            normalRange: "0.15 - 0.45 غ/ل",
            notes: "يقيم وظائف الكلى"
        },
        "GOT /GPT": {
            type: "تحليل كيميائي",
            description: "إنزيمات الكبد",
            preparation: "صيام 8-12 ساعة",
            duration: "نفس اليوم",
            normalRange: "< 40 وحدة/ل",
            notes: "لفحص صحة الكبد"
        },
        "CRP": {
            type: "تحليل مناعي",
            description: "بروتين الالتهاب",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "< 5 ملغ/ل",
            notes: "يكشف عن الالتهابات"
        },
        "FERI": {
            type: "تحليل كيميائي",
            description: "مخزون الحديد",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "30-300 نانوغرام/مل",
            notes: "لتشخيص فقر الدم"
        },
        "VITAMINE D": {
            type: "تحليل هرموني",
            description: "فيتامين د",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "> 30 نانوغرام/مل",
            notes: "مهم لصحة العظام"
        },
        "HBS": {
            type: "تحليل مناعي",
            description: "فحص التهاب الكبد B",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "سلبي",
            notes: "للكشف عن الإصابة بالفيروس"
        },
        "HCV": {
            type: "تحليل مناعي",
            description: "فحص التهاب الكبد C",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "سلبي",
            notes: "للكشف عن الإصابة بالفيروس"
        },
        "HIV": {
            type: "تحليل مناعي",
            description: "فحص فيروس نقص المناعة",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "سلبي",
            notes: "سرية تامة للنتائج"
        },
        "BHCG": {
            type: "تحليل هرموني",
            description: "هرمون الحمل",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "< 5 mUI/ml (غير حامل)",
            notes: "للكشف عن الحمل"
        },
        "PSAT": {
            type: "واسم سرطاني",
            description: "واسم البروستاتا",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "< 4 نانوغرام/مل",
            notes: "للرجال فوق 50 سنة"
        },
        "CA125": {
            type: "واسم سرطاني",
            description: "واسم المبيض",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "< 35 وحدة/مل",
            notes: "للنساء - فحص دوري"
        },
        "TOXG": {
            type: "تحليل مناعي",
            description: "داء المقوسات IgG",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "حسب النتيجة",
            notes: "مهم للحوامل"
        },
        "RUBG": {
            type: "تحليل مناعي",
            description: "الحصبة الألمانية IgG",
            preparation: "لا يتطلب صيام",
            duration: "نفس اليوم",
            normalRange: "حسب النتيجة",
            notes: "مهم للحوامل"
        }
    }
};

// وظيفة للحصول على معلومات التحليل
function getTestInfo(testShortName, testName) {
    // البحث عن معلومات مخصصة أولاً
    if (testInformation.specificTests[testShortName]) {
        return testInformation.specificTests[testShortName];
    }
    
    // تحديد نوع التحليل بناءً على الاسم
    let testType = "تحليل عام";
    
    if (testName.includes("HORMONE") || testName.includes("TSH") || testName.includes("FSH") || 
        testName.includes("LH") || testName.includes("PROLACTINE") || testName.includes("TESTOSTERONE") ||
        testName.includes("OESTRADIOL") || testName.includes("PROGESTERONE") || testName.includes("CORTISOL")) {
        testType = "تحليل هرموني";
    } else if (testName.includes("IgG") || testName.includes("IgM") || testName.includes("ANTI") ||
               testName.includes("SEROLOGIE") || testName.includes("HEPATITE") || testName.includes("HIV")) {
        testType = "تحليل مناعي";
    } else if (testName.includes("CULTURE") || testName.includes("ECB") || testName.includes("BK")) {
        testType = "تحليل ميكروبيولوجي";
    } else if (testName.includes("CA ") || testName.includes("ACE") || testName.includes("AFP") || 
               testName.includes("PSA") || testName.includes("antigène")) {
        testType = "واسم سرطاني";
    } else if (testName.includes("URIN") || testName.includes("24H") || testName.includes("24h")) {
        testType = "تحليل بول";
    } else if (testName.includes("SELLES") || testName.includes("FECALE") || testName.includes("COPROPAR")) {
        testType = "تحليل براز";
    } else if (testName.includes("PCR") || testName.includes("CHARGE VIRALE")) {
        testType = "تحليل جيني/PCR";
    } else {
        testType = "تحليل كيميائي";
    }
    
    // إرجاع المعلومات الافتراضية حسب النوع
    const defaultData = testInformation.defaultInfo[testType] || testInformation.defaultInfo["تحليل كيميائي"];
    
    return {
        type: testType,
        description: "تحليل طبي متخصص",
        preparation: defaultData.preparation,
        duration: defaultData.duration,
        normalRange: "يحدده الطبيب المختص",
        notes: defaultData.notes
    };
}
