from firebase_functions import firestore_fn
from firebase_functions.options import set_global_options
from firebase_admin import firestore, initialize_app

# For cost control, you can set the maximum number of containers that can be
# running at the same time. This helps mitigate the impact of unexpected
# traffic spikes by instead downgrading performance. This limit is a per-function
# limit. You can override the limit for each function using the max_instances
# parameter in the decorator, e.g. @https_fn.on_request(max_instances=5).
set_global_options(max_instances=10, region="europe-north1")

initialize_app()


@firestore_fn.on_document_written(document="reviews/{reviewId}")
def aggregate_review(
	event: firestore_fn.Event[firestore_fn.Change[firestore_fn.DocumentSnapshot]],
) -> None:
	"""Mirror review totals onto the recipient's protected profile documents."""
	if event.data is None or event.data.before.exists or not event.data.after.exists:
		return

	review = event.data.after.to_dict() or {}
	recipient_id = review.get("toUid")
	if not recipient_id:
		return

	client = firestore.client()
	reviews = list(
		client.collection("reviews")
		.where("toUid", "==", recipient_id)
		.stream()
	)
	if not reviews:
		return

	stars_total = 0
	badge_counts = {
		"punctual": 0,
		"reliable": 0,
		"quality": 0,
		"professional": 0,
		"goes_above": 0,
	}
	for review_doc in reviews:
		review_data = review_doc.to_dict() or {}
		stars_total += int(review_data.get("stars", 0))
		badges = review_data.get("badges") or []
		if not badges and review_data.get("badge"):
			badges = [review_data["badge"]]
		for badge in badges:
			if badge in badge_counts:
				badge_counts[badge] += 1

	review_count = len(reviews)
	updates = {
		"averageRating": stars_total / review_count,
		"reviewCount": review_count,
		"badgeCounts": badge_counts,
	}

	user_ref = client.collection("users").document(recipient_id)
	if user_ref.get().exists:
		user_ref.update(updates)

	recipient_role = "worker" if review.get("fromRole") == "employer" else "employer"
	profile_collection = "workerProfiles" if recipient_role == "worker" else "employerProfiles"
	profile_ref = client.collection(profile_collection).document(recipient_id)
	if profile_ref.get().exists:
		profile_ref.update(updates)