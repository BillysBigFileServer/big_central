enum EmailValidationResult {
    Valid,
    TooLong,
    Invalid,
}

export function validate_email(event: any) {
    const email = event.target.value;
    const result = validate_email_inner(email);

    let email_valid_element = document.getElementById("email_valid_text")!;
    switch (result) {
        case EmailValidationResult.Valid:
            email_valid_element.innerText = "";
            break;
        case EmailValidationResult.TooLong:
            email_valid_element.innerText = "Email is too long";
            break;
        case EmailValidationResult.Invalid:
            email_valid_element.innerText = "Invalid email";
            break;
    }
}


function validate_email_inner(email: string): EmailValidationResult {
    if (email.length === 0) {
        return EmailValidationResult.Valid;
    }

    if (email.length > 254) {
        return EmailValidationResult.TooLong;
    }

    const email_regex = /[^@]+@[^@]+/;

    if (email.match(email_regex) == null) {
        return EmailValidationResult.Invalid;
    }

    return EmailValidationResult.Valid;
}

enum PasswordValidationResult {
    Valid,
    TooLong,
}

export function validate_password(event: any) {
    const password = event.target.value;
    const result = validate_password_inner(password);

    let password_valid_element = document.getElementById("password_valid_text")!;
    switch (result) {
        case PasswordValidationResult.Valid:
            password_valid_element.innerText = "";
            break;
        case PasswordValidationResult.TooLong:
            password_valid_element.innerText = "Password is too long";
            break;
    }
}

function validate_password_inner(password: string): PasswordValidationResult {
    if (password.length > 255) {
        return PasswordValidationResult.TooLong;
    }

    return PasswordValidationResult.Valid;
}
