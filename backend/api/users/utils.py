from django.core.mail import EmailMessage
from django.utils.encoding import force_str, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode

class Utils:

    @staticmethod
    def send_email(data):
        email = EmailMessage(
            subject=data['email_subject'],
            body=data['email_body'],
            to=[data['to_email']]
        )
        email.send()

    @staticmethod
    def decode_uid(uid64):
        try:
            uid = force_str(urlsafe_base64_decode(uid64))
            return uid
        except (DjangoUnicodeDecodeError, ValueError, TypeError):
            return None