from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Message, SenderRole, ThreadKind
from .services import SUPPORT_GREETING, get_or_create_support_thread, post_system_message

User = get_user_model()


class NotificationPreferenceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="prefs@example.com")

    def test_system_alert_respects_preference(self):
        from users.models import NotificationPreferences

        NotificationPreferences.objects.update_or_create(user=self.user, defaults={"system_alerts": False})
        self.assertIsNone(post_system_message(self.user, "New device signed in"))

        NotificationPreferences.objects.filter(user=self.user).update(system_alerts=True)
        self.assertIsNotNone(post_system_message(self.user, "New device signed in"))


class SupportThreadTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="shopper@example.com")

    def test_opening_support_seeds_a_greeting(self):
        thread = get_or_create_support_thread(self.user)
        self.assertEqual(thread.slug, "support")
        self.assertEqual(thread.kind, ThreadKind.SUPPORT)
        self.assertTrue(thread.can_reply)
        # Starts as a real conversation, not an empty screen.
        self.assertEqual(thread.messages.count(), 1)
        greeting = thread.messages.get()
        self.assertEqual(greeting.sender, SenderRole.SUPPORT)
        self.assertEqual(greeting.body, SUPPORT_GREETING)

    def test_reopening_support_is_idempotent(self):
        first = get_or_create_support_thread(self.user)
        second = get_or_create_support_thread(self.user)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(second.messages.count(), 1)

    def test_empty_legacy_thread_gets_healed(self):
        # An older support thread created before greetings existed.
        legacy = self.user.threads.create(slug="support", kind=ThreadKind.SUPPORT, name="Live Support")
        self.assertEqual(legacy.messages.count(), 0)
        healed = get_or_create_support_thread(self.user)
        self.assertEqual(healed.pk, legacy.pk)
        self.assertEqual(healed.messages.count(), 1)

    def test_agent_name_for_replies(self):
        thread = get_or_create_support_thread(self.user)
        agent = User.objects.create_user(email="chasedirector@luxeit.com", full_name="Chase D")
        # Automated greeting (no agent) shows the generic team name.
        greeting = thread.messages.get()
        self.assertEqual(greeting.agent_name, "Luxeit Support")
        # A named agent's reply shows a support handle from their username.
        reply = Message.objects.create(thread=thread, sender=SenderRole.SUPPORT, agent=agent, body="Hi!")
        self.assertEqual(reply.agent_name, "chasedirector@luxeitsupport")
        # Falls back to a slug of the full name when there's no email.
        noname = User.objects.create_user(phone="+260970000001", full_name="Lina K")
        reply2 = Message.objects.create(thread=thread, sender=SenderRole.SUPPORT, agent=noname, body="Hello")
        self.assertEqual(reply2.agent_name, "lina.k@luxeitsupport")
        # The customer's own message has no agent name.
        mine = Message.objects.create(thread=thread, sender=SenderRole.USER, body="thanks")
        self.assertIsNone(mine.agent_name)


class SupportApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="api@example.com")
        self.client.force_login(self.user)

    def test_get_support_thread_creates_and_returns_greeting(self):
        res = self.client.get("/api/inbox/threads/support")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["slug"], "support")
        self.assertTrue(data["canReply"])
        self.assertEqual(len(data["messages"]), 1)

    def test_user_can_reply_to_support(self):
        self.client.get("/api/inbox/threads/support")  # ensure it exists
        res = self.client.post(
            "/api/inbox/threads/support/messages",
            data={"body": "Where is my order?"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        senders = [m["sender"] for m in data["messages"]]
        self.assertIn(SenderRole.USER, senders)

    def test_user_cannot_reply_to_non_support_thread(self):
        self.user.threads.create(slug="luxeit", kind=ThreadKind.SYSTEM, name="Luxeit")
        res = self.client.post(
            "/api/inbox/threads/luxeit/messages",
            data={"body": "hello"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 403)
