import json


class Dataset:
    def __init__(self):
        self.data = self.load_data()

    def load_data(self):
        with open("./data/dataset.json", "r") as f:
            return json.load(f)

    def flatten_data(self):
        flattened_data = []
        for card in self.data:
            for block in card["blocks"]:
                for statement in block["statements"]:
                    if statement["sources"] and len(statement["sources"]) > 0:
                        for source in statement["sources"]:
                            flattened_data.append(
                                {
                                    "card_title": card["title"],
                                    "topics": card["topics"],
                                    "proposition": statement["text"],
                                    # "additional_context": statement["description"],
                                    "source": source,
                                }
                            )
                    else:
                        flattened_data.append(
                            {
                                "card_title": card["title"],
                                "proposition": statement["text"],
                                # "additional_context": statement["description"],
                                "sources": statement["sources"],
                            }
                        )
        return flattened_data

    def get_data(self):
        data = []
        for card in self.data:
            data.append(card)
        return self.data

    def get_flattened_data_by_source(self):
        return self.flatten_data()
